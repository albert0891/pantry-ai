import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FinishReason } from '@google/genai';
import { generateRecipeWithAI } from '../recipeGenerator';
import { GEMINI_MODELS } from '../config';

const [FIRST_MODEL, SECOND_MODEL] = GEMINI_MODELS;

// Only the network call is replaced; the attempt logic under test is real.
const generateContent = vi.hoisted(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  return vi.fn();
});

vi.mock('@google/genai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@google/genai')>()),
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const RECIPE = {
  title: 'Tomato Egg Stir-Fry',
  ingredients: ['2 tomatoes', '3 eggs'],
  instructions: ['Scramble the eggs', 'Add the tomatoes'],
  nutrition: {
    calories: 300,
    servings: 1,
    protein: 18,
    carbs: 10,
    fat: 20,
    dietary_tags: ['High Protein'],
    dietitian_tip: 'Quick and balanced.',
  },
};
const answer = (recipe: unknown = RECIPE) => ({
  text: JSON.stringify(recipe),
  candidates: [{ finishReason: FinishReason.STOP }],
});

describe('generateRecipeWithAI attempts', () => {
  const overloaded = new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}');
  const modelsCalled = () => generateContent.mock.calls.map(([request]) => request.model);
  const generate = () => generateRecipeWithAI(['Tomato', 'Egg'], []);

  beforeEach(() => {
    generateContent.mockReset();
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses only the first model when it answers', async () => {
    generateContent.mockResolvedValueOnce(answer());

    await expect(generate()).resolves.toMatchObject({ title: RECIPE.title });
    expect(modelsCalled()).toEqual([FIRST_MODEL]);
  });

  // Fake timers never advance here, so any wait before the next model would hang this test.
  it('moves to the next model right away when the first is overloaded', async () => {
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValueOnce(answer());

    await expect(generate()).resolves.toMatchObject({ title: RECIPE.title });
    expect(modelsCalled()).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('tries the next model when the first returns a malformed recipe', async () => {
    generateContent
      .mockResolvedValueOnce(answer({ title: 'No steps' }))
      .mockResolvedValueOnce(answer());

    await expect(generate()).resolves.toMatchObject({ title: RECIPE.title });
    expect(modelsCalled()).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('gives every attempt a time limit that is enforced on our side only', async () => {
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValueOnce(answer());

    await generate();

    expect(generateContent).toHaveBeenCalledTimes(2);
    for (const [request] of generateContent.mock.calls) {
      expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
      // Gemini answers 400 to any server-side deadline under 10 s (seen 2026-11-04).
      expect(request.config.httpOptions?.timeout).toBeUndefined();
    }
  });

  it('stops after trying every model and reports a safe message', async () => {
    generateContent.mockRejectedValue(overloaded);

    const result = generate();
    const assertion = expect(result).rejects.toThrow('AI is currently feeling uninspired or busy');
    await vi.runAllTimersAsync();
    await assertion;

    expect(modelsCalled()).toEqual(GEMINI_MODELS);
  });

  it('never exposes the raw AI error to the user', async () => {
    generateContent.mockRejectedValue(overloaded);

    const result = generate();
    const assertion = expect(result).rejects.not.toThrow(/503|UNAVAILABLE/);
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('does not pay for another attempt when an answer hits the output cap', async () => {
    generateContent.mockResolvedValueOnce({
      text: '{"title": "Cut o',
      candidates: [{ finishReason: FinishReason.MAX_TOKENS }],
    });

    await expect(generate()).rejects.toThrow('AI is currently feeling uninspired or busy');
    expect(modelsCalled()).toEqual([FIRST_MODEL]);
  });
});
