import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateRecipeWithAI } from '../recipeGenerator';
import { AI_MODELS } from '../config';
import { answer, httpError, modelsAsked, requestBodies } from './groqResponses';

const [FIRST_MODEL, SECOND_MODEL] = AI_MODELS;

// Only the network call is replaced; the attempt logic under test is real.
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const RECIPE = {
  title: 'Tomato Egg Stir-Fry',
  ingredients: ['2 tomatoes', '3 eggs'],
  instructions: ['Scramble the eggs', 'Add the tomatoes'],
  unused_ingredients: [],
  nutrition: {
    calories: 300,
    servings: 1,
    protein: 18,
    carbs: 10,
    fat: 20,
    fiber: null,
    dietary_tags: ['High Protein'],
    dietitian_tip: 'Quick and balanced.',
    healthy_swaps: [],
  },
};
const recipeAnswer = (recipe: unknown = RECIPE) => answer(JSON.stringify(recipe));

describe('generateRecipeWithAI attempts', () => {
  const generate = () => generateRecipeWithAI(['Tomato', 'Egg'], []);

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('uses only the first model when it answers', async () => {
    fetchMock.mockResolvedValueOnce(recipeAnswer());

    await expect(generate()).resolves.toMatchObject({ title: RECIPE.title });
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
  });

  // The strict schema makes the model answer null for a missing fiber estimate.
  it('accepts a null fiber estimate', async () => {
    fetchMock.mockResolvedValueOnce(recipeAnswer());

    await expect(generate()).resolves.toMatchObject({ nutrition: { fiber: null } });
  });

  it('asks for an answer in the shape of a strict schema', async () => {
    fetchMock.mockResolvedValueOnce(recipeAnswer());

    await generate();

    const { json_schema } = requestBodies(fetchMock)[0].response_format;
    expect(json_schema.strict).toBe(true);
    // Strict mode rejects a schema that leaves any property out of `required`.
    for (const schema of [json_schema.schema, json_schema.schema.properties.nutrition]) {
      expect(schema.required).toEqual(Object.keys(schema.properties));
    }
  });

  // Fake timers never advance here, so any wait before the next model would hang this test.
  it('moves to the next model right away when the first is overloaded', async () => {
    fetchMock.mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(recipeAnswer());

    await expect(generate()).resolves.toMatchObject({ title: RECIPE.title });
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('tries the next model when the first returns a malformed recipe', async () => {
    fetchMock
      .mockResolvedValueOnce(recipeAnswer({ title: 'No steps' }))
      .mockResolvedValueOnce(recipeAnswer());

    await expect(generate()).resolves.toMatchObject({ title: RECIPE.title });
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('gives every attempt a time limit', async () => {
    fetchMock.mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(recipeAnswer());

    await generate();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('stops after trying every model and reports a safe message', async () => {
    fetchMock.mockImplementation(async () => httpError(503));

    await expect(generate()).rejects.toThrow('AI is currently feeling uninspired or busy');
    expect(modelsAsked(fetchMock)).toEqual(AI_MODELS);
  });

  it('says to wait when every model is out of quota', async () => {
    fetchMock.mockImplementation(async () => httpError(429));

    await expect(generate()).rejects.toThrow(/wait a minute/);
  });

  it('never exposes the raw AI error to the user', async () => {
    fetchMock.mockImplementation(async () => httpError(503));

    await expect(generate()).rejects.not.toThrow(/503|unavailable/i);
  });

  it('does not pay for another attempt when an answer hits the output cap', async () => {
    fetchMock.mockResolvedValueOnce(answer('{"title": "Cut o', 'length'));

    await expect(generate()).rejects.toThrow('AI is currently feeling uninspired or busy');
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
  });

  it('reports a failure without calling the API when no key is configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '');

    await expect(generate()).rejects.toThrow(/not available/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
