import { prisma } from '../lib/prisma';
import { Category, BoardState, User, PantryItem } from '@prisma/client';
import { generateRecipeWithAI } from '../lib/ai/recipeGenerator';

// ---------------------------------------------------------------------------
// Educational Note: Resolvers in GraphQL
//
// If the Schema is the "Interface", Resolvers are the "Implementation".
// They provide the instructions for turning a GraphQL operation (Query/Mutation)
// into data. Unlike a REST endpoint controller that must return a fixed JSON object,
// a resolver dictates exactly how to fetch only the fields the client asked for.
// ---------------------------------------------------------------------------

/**
 * Enterprise Pattern: Reusable Authentication Helper
 * Extracts repetitive auth checks into a single function to enforce DRY (Don't Repeat Yourself) principles.
 */
const ensureAuthenticatedUser = async (context: { userId?: string }): Promise<User> => {
  if (!context.userId) {
    throw new Error('Unauthorized: Please log in');
  }
  const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }
  return user;
};

export const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL in Next.js!',

    myPantryItems: async (_: unknown, args: any, context: { userId?: string }) => {
      // For queries, if user doesn't exist, we might just return empty instead of throwing to be resilient
      if (!context.userId) throw new Error('Unauthorized: Please log in');
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) return [];

      return await prisma.pantryItem.findMany({
        where: { userId: user.id },
        orderBy: { expiryDate: 'asc' },
      });
    },

    myRecipes: async (_: unknown, args: any, context: { userId?: string }) => {
      if (!context.userId) throw new Error('Unauthorized');
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) return [];

      return await prisma.recipe.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    addPantryItem: async (
      _: unknown,
      args: {
        name: string;
        quantity: number;
        unit?: string;
        category?: Category;
        expiryDate?: string;
        boardState?: BoardState;
      },
      context: { userId?: string },
    ) => {
      if (!context.userId) throw new Error('Unauthorized');
      // Enterprise Pattern: Upsert guarantees the user exists before associating data to them.
      const user = await prisma.user.upsert({
        where: { cognitoId: context.userId },
        update: {},
        create: { cognitoId: context.userId, email: `${context.userId}@cognito.local` },
      });

      return await prisma.pantryItem.create({
        data: {
          name: args.name,
          quantity: args.quantity,
          unit: args.unit,
          category: args.category || 'OTHER',
          boardState: args.boardState || 'TO_BUY',
          ...(args.expiryDate && { expiryDate: new Date(args.expiryDate) }),
          userId: user.id,
        },
      });
    },

    editPantryItem: async (
      _: unknown,
      args: {
        id: string;
        name: string;
        quantity: number;
        unit?: string;
        category: Category;
        expiryDate?: string;
      },
      context: { userId?: string },
    ) => {
      const user = await ensureAuthenticatedUser(context);

      const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (!item || item.userId !== user.id) throw new Error('Forbidden');

      return await prisma.pantryItem.update({
        where: { id: args.id },
        data: {
          name: args.name,
          quantity: args.quantity,
          unit: args.unit,
          category: args.category,
          expiryDate: args.expiryDate ? new Date(args.expiryDate) : null,
        },
      });
    },

    deletePantryItem: async (_: unknown, { id }: { id: string }, context: { userId?: string }) => {
      const user = await ensureAuthenticatedUser(context);

      const item = await prisma.pantryItem.findUnique({ where: { id } });
      if (item?.userId !== user.id) throw new Error('Forbidden');

      await prisma.pantryItem.delete({ where: { id } });
      return true;
    },

    updateItemState: async (
      _: unknown,
      args: { id: string; newState: BoardState },
      context: { userId?: string },
    ) => {
      const user = await ensureAuthenticatedUser(context);

      const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (item?.userId !== user.id) throw new Error('Forbidden');

      return await prisma.pantryItem.update({
        where: { id: args.id },
        data: { boardState: args.newState },
      });
    },

    /**
     * Enterprise Refactor:
     * Broken down complex item movement (split vs whole) into clear conditional branches.
     */
    moveItem: async (
      _: unknown,
      args: { id: string; amount: number; targetState: BoardState },
      context: { userId?: string },
    ) => {
      const user = await ensureAuthenticatedUser(context);

      const sourceItem = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (!sourceItem || sourceItem.userId !== user.id) throw new Error('Forbidden');

      const moveAmount = Math.min(args.amount, sourceItem.quantity);
      const isFullMove = moveAmount >= sourceItem.quantity;

      // Look for an existing identical item in the target state to merge into
      const existingTargetItem = await prisma.pantryItem.findFirst({
        where: {
          userId: user.id,
          boardState: args.targetState,
          name: sourceItem.name,
          unit: sourceItem.unit,
          expiryDate: sourceItem.expiryDate,
        },
      });

      if (isFullMove) {
        return await handleFullMove(sourceItem, existingTargetItem, args.targetState);
      } else {
        return await handlePartialMove(
          sourceItem,
          existingTargetItem,
          moveAmount,
          args.targetState,
          user.id,
        );
      }
    },

    generateRecipe: async (
      _: unknown,
      args: { mustUseItemIds: string[]; previouslyUsedIngredients?: string[] },
      context: { userId?: string },
    ) => {
      const user = await ensureAuthenticatedUser(context);

      // Fetch ALL items to allow cross-board recipe planning
      const allItems = await prisma.pantryItem.findMany({
        where: { userId: user.id },
      });

      // 1. Must-use items: Anything the user explicitly checked (can be TO_BUY, IN_PANTRY, or CONSUMED)
      const mustUseItems = allItems
        .filter((item) => args.mustUseItemIds.includes(item.id))
        .map((i) => i.name);

      // 2. Supporting items: Only items currently IN_PANTRY that weren't explicitly checked
      const supportingItems = allItems
        .filter((item) => item.boardState === 'IN_PANTRY' && !args.mustUseItemIds.includes(item.id))
        .map((i) => i.name);

      return await generateRecipeWithAI(
        mustUseItems,
        supportingItems,
        args.previouslyUsedIngredients,
      );
    },

    saveRecipe: async (
      _: unknown,
      args: { title: string; ingredients: string[]; instructions: string[] },
      context: { userId?: string },
    ) => {
      const user = await ensureAuthenticatedUser(context);

      return await prisma.recipe.create({
        data: {
          title: args.title,
          ingredients: args.ingredients,
          instructions: args.instructions,
          userId: user.id,
        },
      });
    },

    deleteRecipe: async (_: unknown, { id }: { id: string }, context: { userId?: string }) => {
      const user = await ensureAuthenticatedUser(context);

      const recipe = await prisma.recipe.findUnique({ where: { id } });
      if (recipe?.userId !== user.id) throw new Error('Forbidden');

      await prisma.recipe.delete({ where: { id } });
      return true;
    },
  },
};

// ---------------------------------------------------------------------------
// Helper Functions for Move Logic
// ---------------------------------------------------------------------------

async function handleFullMove(
  sourceItem: PantryItem,
  existingTargetItem: PantryItem | null,
  targetState: BoardState,
) {
  if (existingTargetItem && existingTargetItem.id !== sourceItem.id) {
    // Merge into the existing target item atomically
    const [mergedItem] = await prisma.$transaction([
      prisma.pantryItem.update({
        where: { id: existingTargetItem.id },
        data: { quantity: existingTargetItem.quantity + sourceItem.quantity },
      }),
      prisma.pantryItem.delete({ where: { id: sourceItem.id } }),
    ]);
    return mergedItem;
  } else {
    // No identical item exists in the target state, so just move the card
    return await prisma.pantryItem.update({
      where: { id: sourceItem.id },
      data: { boardState: targetState },
    });
  }
}

async function handlePartialMove(
  sourceItem: PantryItem,
  existingTargetItem: PantryItem | null,
  moveAmount: number,
  targetState: BoardState,
  userId: string,
) {
  if (existingTargetItem) {
    // Merge into existing identical item atomically
    const [updatedSourceItem] = await prisma.$transaction([
      prisma.pantryItem.update({
        where: { id: sourceItem.id },
        data: { quantity: sourceItem.quantity - moveAmount },
      }),
      prisma.pantryItem.update({
        where: { id: existingTargetItem.id },
        data: { quantity: existingTargetItem.quantity + moveAmount },
      }),
    ]);
    return updatedSourceItem;
  } else {
    // Create a new card in the target state atomically
    const [updatedSourceItem] = await prisma.$transaction([
      prisma.pantryItem.update({
        where: { id: sourceItem.id },
        data: { quantity: sourceItem.quantity - moveAmount },
      }),
      prisma.pantryItem.create({
        data: {
          name: sourceItem.name,
          quantity: moveAmount,
          unit: sourceItem.unit,
          category: sourceItem.category,
          expiryDate: sourceItem.expiryDate,
          imageUrl: sourceItem.imageUrl,
          boardState: targetState,
          userId: userId,
        },
      }),
    ]);
    return updatedSourceItem;
  }
}
