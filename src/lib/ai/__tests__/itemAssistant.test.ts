import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCategorizePrompt,
  buildVoicePrompt,
  categorizeItemWithAI,
  parseVoiceInputWithAI,
} from '../itemAssistant';
import { CATEGORY_LIST } from '../../constants/categories';
import { GEMINI_MODELS } from '../config';

const [FIRST_MODEL, SECOND_MODEL] = GEMINI_MODELS;

// Only the network call is replaced; the fallback logic under test is real.
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

describe('buildVoicePrompt', () => {
  it("anchors relative dates to the user's today, with its weekday", () => {
    expect(buildVoicePrompt('Milk expires tomorrow', '2026-11-04')).toContain(
      'Assume today is Wednesday, 2026-11-04.',
    );
  });
});

describe('categorizeItemWithAI', () => {
  const overloaded = new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}');
  const modelsCalled = () => generateContent.mock.calls.map(([request]) => request.model);

  beforeEach(() => {
    generateContent.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses only the first model when it answers', async () => {
    generateContent.mockResolvedValueOnce({ text: 'PRODUCE' });

    await expect(categorizeItemWithAI('Bananas')).resolves.toBe('PRODUCE');
    expect(modelsCalled()).toEqual([FIRST_MODEL]);
  });

  it('moves past a model whose daily quota is used up', async () => {
    const quotaUsedUp = new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}');
    generateContent
      .mockRejectedValueOnce(overloaded)
      .mockRejectedValueOnce(quotaUsedUp)
      .mockResolvedValueOnce({ text: 'PRODUCE' });

    await expect(categorizeItemWithAI('Bananas')).resolves.toBe('PRODUCE');
    expect(modelsCalled()).toEqual(GEMINI_MODELS);
  });

  it('asks the next model when the first is overloaded', async () => {
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValueOnce({ text: 'DAIRY' });

    await expect(categorizeItemWithAI('Whole Milk')).resolves.toBe('DAIRY');
    expect(modelsCalled()).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('gives every attempt a time limit, so an overloaded model cannot hang the button', async () => {
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValueOnce({ text: 'MEAT' });

    await categorizeItemWithAI('Salmon');

    for (const [request] of generateContent.mock.calls) {
      expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
      // Gemini answers 400 to any server-side deadline under 10 s (seen 2026-11-04).
      expect(request.config.httpOptions?.timeout).toBeUndefined();
    }
  });

  // Returning OTHER here would replace the correct category of an item being edited.
  it('reports a failure instead of answering OTHER when every model fails', async () => {
    generateContent.mockRejectedValue(overloaded);

    await expect(categorizeItemWithAI('Bananas')).rejects.toThrow(/pick a category/i);
    expect(modelsCalled()).toEqual(GEMINI_MODELS);
  });

  it('never exposes the raw AI error to the user', async () => {
    generateContent.mockRejectedValue(overloaded);

    await expect(categorizeItemWithAI('Bananas')).rejects.not.toThrow(/503|UNAVAILABLE/);
  });

  it.each(['GARBAGE', 'Sure! That is produce.', ''])(
    'treats the unusable answer %j as OTHER, without paying for a second model',
    async (text) => {
      generateContent.mockResolvedValueOnce({ text });

      await expect(categorizeItemWithAI('Bananas')).resolves.toBe('OTHER');
      expect(modelsCalled()).toEqual([FIRST_MODEL]);
    },
  );

  it('reports a failure when no API key is configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.resetModules();
    const { categorizeItemWithAI: withoutKey } = await import('../itemAssistant');

    await expect(withoutKey('Bananas')).rejects.toThrow(/pick a category/i);
    expect(generateContent).not.toHaveBeenCalled();
  });
});

describe('parseVoiceInputWithAI', () => {
  const overloaded = new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}');
  const modelsCalled = () => generateContent.mock.calls.map(([request]) => request.model);
  const parse = () => parseVoiceInputWithAI('two cartons of oat milk', '2026-11-04');
  const OAT_MILK = { text: '{"name":"Oat Milk","quantity":2,"category":"BEVERAGE"}' };

  beforeEach(() => {
    generateContent.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses only the first model when it answers', async () => {
    generateContent.mockResolvedValueOnce(OAT_MILK);

    await expect(parse()).resolves.toMatchObject({ name: 'Oat Milk', quantity: 2 });
    expect(modelsCalled()).toEqual([FIRST_MODEL]);
  });

  it('asks the next model when the first is overloaded', async () => {
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValueOnce(OAT_MILK);

    await expect(parse()).resolves.toMatchObject({ name: 'Oat Milk', category: 'BEVERAGE' });
    expect(modelsCalled()).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('gives every attempt a time limit that is enforced on our side only', async () => {
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValueOnce(OAT_MILK);

    await parse();

    expect(generateContent).toHaveBeenCalledTimes(2);
    for (const [request] of generateContent.mock.calls) {
      expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
      expect(request.config.httpOptions?.timeout).toBeUndefined();
    }
  });

  // "Couldn't understand that" would blame the user's speech for Gemini being down.
  it('says the AI is busy, not that it misheard, when every model fails', async () => {
    generateContent.mockRejectedValue(overloaded);

    await expect(parse()).rejects.toThrow(/busy/i);
    await expect(parse()).rejects.not.toThrow(/understand|503|UNAVAILABLE/);
  });

  it('reports a bad answer as not understood, without paying for a second model', async () => {
    generateContent.mockResolvedValueOnce({ text: 'not json' });

    await expect(parse()).rejects.toThrow(/understand/i);
    expect(modelsCalled()).toEqual([FIRST_MODEL]);
  });
});

describe('category descriptions in AI prompts', () => {
  const prompts = () => [
    buildCategorizePrompt('Coffee Beans'),
    buildVoicePrompt('two bags of coffee beans', '2026-11-04'),
  ];

  // Without these the AI guesses: it files coffee beans under PANTRY while the form
  // tells the user that coffee belongs to BEVERAGE.
  it('gives the AI the same description users see in the category dropdown', () => {
    for (const prompt of prompts()) {
      for (const category of CATEGORY_LIST) {
        expect(prompt).toContain(`${category.id}: ${category.tagline}`);
      }
    }
  });

  it('keeps the long example lists out, so the prompts stay short', () => {
    for (const prompt of prompts()) {
      for (const example of ['Whole Milk', 'Chicken Breast', 'Paper Towels']) {
        expect(prompt).not.toContain(example);
      }
    }
  });

  it('names the item being classified', () => {
    expect(buildCategorizePrompt('Coffee Beans')).toContain('"Coffee Beans"');
  });

  it('is what auto-categorize actually sends', async () => {
    generateContent.mockReset();
    generateContent.mockResolvedValueOnce({ text: 'BEVERAGE' });

    await expect(categorizeItemWithAI('Coffee Beans')).resolves.toBe('BEVERAGE');
    expect(generateContent.mock.calls[0][0].contents).toBe(buildCategorizePrompt('Coffee Beans'));
  });
});
