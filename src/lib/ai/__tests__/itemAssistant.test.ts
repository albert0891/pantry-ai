import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCategorizePrompt,
  buildVoicePrompt,
  categorizeItemWithAI,
  parseVoiceInputWithAI,
} from '../itemAssistant';
import { CATEGORY_LIST } from '../../constants/categories';
import { AI_MODELS } from '../config';
import { answer, httpError, modelsAsked, requestBodies } from './groqResponses';

const [FIRST_MODEL, SECOND_MODEL] = AI_MODELS;

// Only the network call is replaced; the fallback logic under test is real.
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubEnv('GROQ_API_KEY', 'test-key');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('buildVoicePrompt', () => {
  it("anchors relative dates to the user's today, with its weekday", () => {
    expect(buildVoicePrompt('Milk expires tomorrow', '2026-11-04')).toContain(
      'Assume today is Wednesday, 2026-11-04.',
    );
  });
});

describe('categorizeItemWithAI', () => {
  it('uses only the first model when it answers', async () => {
    fetchMock.mockResolvedValueOnce(answer('PRODUCE'));

    await expect(categorizeItemWithAI('Bananas')).resolves.toBe('PRODUCE');
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
  });

  it('moves past a model whose daily quota is used up', async () => {
    fetchMock.mockResolvedValueOnce(httpError(429)).mockResolvedValueOnce(answer('PRODUCE'));

    await expect(categorizeItemWithAI('Bananas')).resolves.toBe('PRODUCE');
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('asks the next model when the first is overloaded', async () => {
    fetchMock.mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(answer('DAIRY'));

    await expect(categorizeItemWithAI('Whole Milk')).resolves.toBe('DAIRY');
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  it('gives every attempt a time limit, so a stuck request cannot hang the button', async () => {
    fetchMock.mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(answer('MEAT'));

    await categorizeItemWithAI('Salmon');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });

  // Returning OTHER here would replace the correct category of an item being edited.
  it('reports a failure instead of answering OTHER when every model fails', async () => {
    fetchMock.mockImplementation(async () => httpError(503));

    await expect(categorizeItemWithAI('Bananas')).rejects.toThrow(/pick a category/i);
    expect(modelsAsked(fetchMock)).toEqual(AI_MODELS);
  });

  it('never exposes the raw AI error to the user', async () => {
    fetchMock.mockImplementation(async () => httpError(503));

    await expect(categorizeItemWithAI('Bananas')).rejects.not.toThrow(/503|unavailable/i);
  });

  it.each(['GARBAGE', 'Sure! That is produce.', ''])(
    'treats the unusable answer %j as OTHER, without paying for a second model',
    async (text) => {
      fetchMock.mockResolvedValueOnce(answer(text));

      await expect(categorizeItemWithAI('Bananas')).resolves.toBe('OTHER');
      expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
    },
  );

  it('reports a failure when no API key is configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '');

    await expect(categorizeItemWithAI('Bananas')).rejects.toThrow(/pick a category/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('parseVoiceInputWithAI', () => {
  const parse = () => parseVoiceInputWithAI('two cartons of oat milk', '2026-11-04');
  const OAT_MILK = '{"name":"Oat Milk","quantity":2,"category":"BEVERAGE","expiryDate":null}';

  it('uses only the first model when it answers', async () => {
    fetchMock.mockResolvedValueOnce(answer(OAT_MILK));

    await expect(parse()).resolves.toMatchObject({ name: 'Oat Milk', quantity: 2 });
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
  });

  it('asks for an answer in the shape of a strict schema', async () => {
    fetchMock.mockResolvedValueOnce(answer(OAT_MILK));

    await parse();

    const { json_schema } = requestBodies(fetchMock)[0].response_format;
    expect(json_schema.strict).toBe(true);
    // Strict mode rejects a schema that leaves any property out of `required`.
    expect(json_schema.schema.required).toEqual(Object.keys(json_schema.schema.properties));
  });

  // The strict schema makes the model answer null for what it did not hear.
  it('treats null fields as not mentioned, not as the text "null"', async () => {
    fetchMock.mockResolvedValueOnce(
      answer('{"name":"Milk","quantity":null,"category":null,"expiryDate":null}'),
    );

    await expect(parse()).resolves.toEqual({ name: 'Milk' });
  });

  it('asks the next model when the first is overloaded', async () => {
    fetchMock.mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(answer(OAT_MILK));

    await expect(parse()).resolves.toMatchObject({ name: 'Oat Milk', category: 'BEVERAGE' });
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL, SECOND_MODEL]);
  });

  // "Couldn't understand that" would blame the user's speech for the AI being down.
  it('says the AI is busy, not that it misheard, when every model fails', async () => {
    fetchMock.mockImplementation(async () => httpError(503));

    await expect(parse()).rejects.toThrow(/busy/i);
    await expect(parse()).rejects.not.toThrow(/understand|503|unavailable/i);
  });

  it('reports a bad answer as not understood, without paying for a second model', async () => {
    fetchMock.mockResolvedValueOnce(answer('not json'));

    await expect(parse()).rejects.toThrow(/understand/i);
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
  });

  it('reports a cut-off answer as not understood, without paying for a second model', async () => {
    fetchMock.mockResolvedValueOnce(answer('{"name":"Oat', 'length'));

    await expect(parse()).rejects.toThrow(/understand/i);
    expect(modelsAsked(fetchMock)).toEqual([FIRST_MODEL]);
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
    fetchMock.mockResolvedValueOnce(answer('BEVERAGE'));

    await expect(categorizeItemWithAI('Coffee Beans')).resolves.toBe('BEVERAGE');
    expect(requestBodies(fetchMock)[0].messages[0].content).toBe(
      buildCategorizePrompt('Coffee Beans'),
    );
  });
});
