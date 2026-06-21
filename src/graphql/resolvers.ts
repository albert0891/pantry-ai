import { prisma } from '../lib/prisma';
import { Category } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

// 初始化 Gemini SDK (如果環境變數沒有，可以先預設 dummy)
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// ---------------------------------------------------------------------------
// Educational Note: Resolvers in GraphQL
//
// If the Schema is the "Interface", Resolvers are the "Implementation".
// They provide the instructions for turning a GraphQL operation (Query/Mutation)
// into data. Unlike a REST endpoint controller that must return a fixed JSON object,
// a resolver dictates exactly how to fetch only the fields the client asked for.
// ---------------------------------------------------------------------------

export const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL in Next.js!',
    
    myPantryItems: async (_: unknown, args: any, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized: Please log in");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) return []; 
      return await prisma.pantryItem.findMany({
        where: { userId: user.id },
        orderBy: { expiryDate: 'asc' },
      });
    },

    myRecipes: async (_: unknown, args: any, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) return [];
      return await prisma.recipe.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }
  },
  
  Mutation: {
    addPantryItem: async (_: unknown, args: { name: string, quantity: number, unit?: string, category?: Category, expiryDate?: string }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.upsert({
        where: { cognitoId: context.userId },
        update: {},
        create: { cognitoId: context.userId, email: `${context.userId}@cognito.local` }
      });

      return await prisma.pantryItem.create({
        data: {
          name: args.name,
          quantity: args.quantity,
          unit: args.unit,
          category: args.category || 'OTHER',
          ...(args.expiryDate && { expiryDate: new Date(args.expiryDate) }),
          userId: user.id
        }
      });
    },

    editPantryItem: async (_: unknown, args: { id: string, name: string, quantity: number, unit?: string, category: Category, expiryDate?: string }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) throw new Error("Unauthorized");

      const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (!item || item.userId !== user.id) throw new Error("Forbidden");

      return await prisma.pantryItem.update({
        where: { id: args.id },
        data: {
          name: args.name,
          quantity: args.quantity,
          unit: args.unit,
          category: args.category,
          expiryDate: args.expiryDate ? new Date(args.expiryDate) : null
        }
      });
    },
    
    deletePantryItem: async (_: unknown, { id }: { id: string }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) throw new Error("Unauthorized");

      const item = await prisma.pantryItem.findUnique({ where: { id } });
      if (item?.userId !== user.id) throw new Error("Forbidden");

      await prisma.pantryItem.delete({ where: { id } });
      return true;
    },

    updateItemState: async (_: unknown, args: { id: string, newState: 'TO_BUY' | 'IN_PANTRY' | 'CONSUMED' }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) throw new Error("Unauthorized");

      const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (item?.userId !== user.id) throw new Error("Forbidden");

      return await prisma.pantryItem.update({
        where: { id: args.id },
        data: { boardState: args.newState }
      });
    },

    moveItem: async (_: unknown, args: { id: string, amount: number, targetState: 'TO_BUY' | 'IN_PANTRY' | 'CONSUMED' }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) throw new Error("Unauthorized");

      const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (!item || item.userId !== user.id) throw new Error("Forbidden");

      if (args.amount >= item.quantity) {
        // Move entire item to targetState
        return await prisma.pantryItem.update({
          where: { id: args.id },
          data: { boardState: args.targetState }
        });
      } else {
        // Split logic
        const updatedItem = await prisma.pantryItem.update({
          where: { id: args.id },
          data: { quantity: item.quantity - args.amount }
        });

        // Auto-merge with existing identical item in targetState
        const existingTargetItem = await prisma.pantryItem.findFirst({
          where: {
            userId: user.id,
            boardState: args.targetState,
            name: item.name,
            unit: item.unit,
            expiryDate: item.expiryDate 
          }
        });

        if (existingTargetItem) {
          await prisma.pantryItem.update({
            where: { id: existingTargetItem.id },
            data: { quantity: existingTargetItem.quantity + args.amount }
          });
        } else {
          await prisma.pantryItem.create({
            data: {
              name: item.name,
              quantity: args.amount,
              unit: item.unit,
              category: item.category,
              expiryDate: item.expiryDate,
              imageUrl: item.imageUrl,
              boardState: args.targetState,
              userId: user.id
            }
          });
        }
        return updatedItem;
      }
    },

    generateRecipe: async (_: unknown, args: { mustUseItemIds: string[] }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) throw new Error("Unauthorized");

      // 移除原有的 mock early return，統一交由 catch 處理

      const allPantryItems = await prisma.pantryItem.findMany({
        where: { userId: user.id, boardState: 'IN_PANTRY' }
      });

      const mustUseItems = allPantryItems.filter(item => args.mustUseItemIds.includes(item.id));
      const supportingItems = allPantryItems.filter(item => !args.mustUseItemIds.includes(item.id));

      const ingredientsList = [...mustUseItems, ...supportingItems].map(i => i.name).join(', ');
      
      const prompt = `You are an expert chef. I have these ingredients: ${ingredientsList}.
        Please generate a delicious recipe using these items. You may include other common pantry staples (like salt, oil, water, etc.) if needed.
        
        CRITICAL LANGUAGE RULE: 
        If any of the provided ingredients contain Chinese characters, you MUST output the entire recipe (title, ingredients, instructions) in Traditional Chinese (繁體中文). 
        Otherwise, if all ingredients are in English, output the recipe in English.

        Return the recipe strictly in JSON format matching this schema:
        {
          "title": "Recipe Title",
          "ingredients": ["1 cup ingredient", "2 tbsp oil"],
          "instructions": ["Step 1", "Step 2"]
        }`;

      if (!ai) {
         throw new Error("GoogleGenAI is not initialized. Check your GEMINI_API_KEY environment variable and ensure you restarted the Next.js server.");
      }

      const MAX_RETRIES = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
          
          const jsonText = response.text || "{}";
          const result = JSON.parse(jsonText);
          
          if (!result.title || typeof result.title !== 'string') {
             throw new Error("Missing or invalid 'title' in JSON response");
          }
          if (!Array.isArray(result.ingredients) || result.ingredients.length === 0) {
             throw new Error("Missing or invalid 'ingredients' array in JSON response");
          }
          if (!Array.isArray(result.instructions) || result.instructions.length === 0) {
             throw new Error("Missing or invalid 'instructions' array in JSON response");
          }

          return {
            title: result.title,
            ingredients: result.ingredients,
            instructions: result.instructions
          };
        } catch (err: any) {
           console.warn(`[Gemini API] Attempt ${attempt} failed:`, err.message);
           lastError = err;
           // 繼續迴圈重試
        }
      }

      console.error("Gemini API Error (All retries exhausted):", lastError);
      throw new Error("AI is currently feeling uninspired or busy. Please try again.");
    },

    saveRecipe: async (_: unknown, args: { title: string, ingredients: string[], instructions: string[] }, context: { userId?: string }) => {
      if (!context.userId) throw new Error("Unauthorized");
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) throw new Error("Unauthorized");

      return await prisma.recipe.create({
        data: {
          title: args.title,
          ingredients: args.ingredients,
          instructions: args.instructions,
          userId: user.id
        }
      });
    }
  }
};
