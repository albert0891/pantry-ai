import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../schema';
import { resolvers } from '../resolvers';
import { CATEGORIZE_ITEM } from '../../hooks/useItemAssistant';

// The real schema and resolvers run here; only the database and the AI are replaced.
const USER = { id: 'user-1', cognitoId: 'cognito-1' };
const db = vi.hoisted(() => ({ user: { upsert: vi.fn(), findUnique: vi.fn() } }));
const ai = vi.hoisted(() => ({ parseVoiceInputWithAI: vi.fn(), categorizeItemWithAI: vi.fn() }));

vi.mock('../../lib/prisma', () => ({ prisma: db }));
vi.mock('../../lib/ai/itemAssistant', () => ai);
vi.mock('../../lib/ai/recipeGenerator', () => ({ generateRecipeWithAI: vi.fn() }));
vi.mock('../../lib/rateLimit/aiRateLimiter', () => ({ enforceAiRateLimit: vi.fn() }));

const server = new ApolloServer<{ userId?: string }>({ typeDefs, resolvers });

const categorize = async (name: string) => {
  const response = await server.executeOperation(
    { query: CATEGORIZE_ITEM, variables: { name } },
    { contextValue: { userId: USER.cognitoId } },
  );
  if (response.body.kind !== 'single') throw new Error('Expected a single GraphQL result');
  return response.body.singleResult;
};

describe('categorizeItem mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.user.upsert.mockResolvedValue(USER);
    db.user.findUnique.mockResolvedValue(USER);
  });

  it('returns the suggested category', async () => {
    ai.categorizeItemWithAI.mockResolvedValue('PRODUCE');

    const { data, errors } = await categorize('Bananas');

    expect(errors).toBeUndefined();
    expect(data).toEqual({ categorizeItem: 'PRODUCE' });
  });

  // The item form shows this message and leaves the current category untouched.
  it('passes the AI failure message to the client instead of inventing a category', async () => {
    const message = 'AI is busy right now. Please pick a category yourself.';
    ai.categorizeItemWithAI.mockRejectedValue(new Error(message));

    const { data, errors } = await categorize('Bananas');

    expect(data).toBeNull();
    expect(errors?.[0].message).toBe(message);
  });
});
