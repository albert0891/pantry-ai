import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Category, BoardState, User, PantryItem } from '@prisma/client';
import { generateRecipeWithAI } from '../lib/ai/recipeGenerator';
import { categorizeItemWithAI, parseVoiceInputWithAI } from '../lib/ai/itemAssistant';
import { enforceAiRateLimit } from '../lib/rateLimit/aiRateLimiter';
import { AI_INPUT_LIMITS } from '../lib/constants/limits';
import { ItemNameSchema } from '../lib/schemas/pantry';
import {
  CategorizeItemArgsSchema,
  GenerateRecipeArgsSchema,
  ParseVoiceInputArgsSchema,
  toPromptNames,
} from '../lib/schemas/aiInput';

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

/**
 * Validates resolver args with Zod. A failure becomes a BAD_USER_INPUT error
 * whose message is safe to show in the UI.
 */
const parseArgs = <S extends z.ZodType>(schema: S, args: unknown): z.output<S> => {
  const result = schema.safeParse(args);
  if (!result.success) {
    throw new GraphQLError(result.error.issues[0]?.message ?? 'Invalid input.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return result.data;
};

export const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL in Next.js!',

    myPantryItems: async (
      _: unknown,
      args: Record<string, unknown>,
      context: { userId?: string },
    ) => {
      // For queries, if user doesn't exist, we might just return empty instead of throwing to be resilient
      if (!context.userId) throw new Error('Unauthorized: Please log in');
      const user = await prisma.user.findUnique({ where: { cognitoId: context.userId } });
      if (!user) return [];

      return await prisma.pantryItem.findMany({
        where: { userId: user.id },
        orderBy: { expiryDate: 'asc' },
      });
    },

    myRecipes: async (_: unknown, args: Record<string, unknown>, context: { userId?: string }) => {
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
      const name = parseArgs(ItemNameSchema, args.name);
      // Enterprise Pattern: Upsert guarantees the user exists before associating data to them.
      const user = await prisma.user.upsert({
        where: { cognitoId: context.userId },
        update: {},
        create: { cognitoId: context.userId },
      });

      return await prisma.pantryItem.create({
        data: {
          name,
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
      const name = parseArgs(ItemNameSchema, args.name);

      const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
      if (!item || item.userId !== user.id) throw new Error('Forbidden');

      return await prisma.pantryItem.update({
        where: { id: args.id },
        data: {
          name,
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
      context: { userId?: string; ip?: string | null },
    ) => {
      const user = await ensureAuthenticatedUser(context);
      const { mustUseItemIds, previouslyUsedIngredients } = parseArgs(
        GenerateRecipeArgsSchema,
        args,
      );

      // 1. Must-use items: anything the user explicitly checked (TO_BUY, IN_PANTRY, or CONSUMED)
      const mustUseItems = await prisma.pantryItem.findMany({
        where: { userId: user.id, id: { in: mustUseItemIds } },
        select: { name: true },
      });
      if (mustUseItems.length === 0) {
        throw new GraphQLError('The selected items no longer exist. Please pick them again.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // 2. Supporting items: other IN_PANTRY items, soonest expiry first. Capped so a
      // large pantry cannot inflate the prompt (and the bill).
      const supportingItems = await prisma.pantryItem.findMany({
        where: { userId: user.id, boardState: 'IN_PANTRY', id: { notIn: mustUseItemIds } },
        orderBy: { expiryDate: { sort: 'asc', nulls: 'last' } },
        take: AI_INPUT_LIMITS.supportingItems,
        select: { name: true },
      });

      // Charge the quota only once the request is valid and will reach the AI.
      // Keyed by Cognito id, which is stable per account.
      await enforceAiRateLimit('recipe', user.cognitoId, context.ip ?? null);

      return await generateRecipeWithAI(
        toPromptNames(mustUseItems.map((item) => item.name)),
        toPromptNames(supportingItems.map((item) => item.name)),
        previouslyUsedIngredients ?? undefined,
      );
    },

    categorizeItem: async (
      _: unknown,
      args: { name: string },
      context: { userId?: string; ip?: string | null },
    ) => {
      const user = await ensureAuthenticatedUser(context);
      const { name } = parseArgs(CategorizeItemArgsSchema, args);
      // An empty name needs no AI, so it should not cost the user any quota.
      if (!name) return 'OTHER';
      await enforceAiRateLimit('categorize', user.cognitoId, context.ip ?? null);

      return await categorizeItemWithAI(name);
    },

    parseVoiceInput: async (
      _: unknown,
      args: { transcript: string },
      context: { userId?: string; ip?: string | null },
    ) => {
      const user = await ensureAuthenticatedUser(context);
      const { transcript } = parseArgs(ParseVoiceInputArgsSchema, args);
      await enforceAiRateLimit('voice', user.cognitoId, context.ip ?? null);

      return await parseVoiceInputWithAI(transcript);
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
