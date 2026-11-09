import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWithFallback, OutputCapError, parseJsonAnswer } from '../client';
import { AI_MODELS, MAX_OUTPUT_TOKENS } from '../config';
import { answer, httpError, modelsAsked, requestBodies } from './groqResponses';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const asText = (text: string) => text;

describe('parseJsonAnswer', () => {
  // Kept, a null reaches z.coerce.string() and becomes the text "null".
  it('drops fields the model answered with null, at any depth', () => {
    expect(
      parseJsonAnswer('{"name":"Milk","quantity":null,"nutrition":{"fiber":null,"fat":2}}'),
    ).toEqual({ name: 'Milk', nutrition: { fat: 2 } });
  });

  it('reads JSON wrapped in a markdown code block', () => {
    expect(parseJsonAnswer('```json\n{"name":"Milk"}\n```')).toEqual({ name: 'Milk' });
  });

  it('throws on an answer that is not JSON', () => {
    expect(() => parseJsonAnswer('Sure! Here is your item.')).toThrow();
  });
});

describe('generateWithFallback', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('sends the key, the output cap and a strict schema to the first model', async () => {
    fetchMock.mockResolvedValueOnce(answer('{}'));
    const schema = { type: 'object' };

    await generateWithFallback('voice', 'prompt', { schema, parse: asText });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(requestBodies(fetchMock)[0]).toMatchObject({
      model: AI_MODELS[0],
      messages: [{ role: 'user', content: 'prompt' }],
      max_completion_tokens: MAX_OUTPUT_TOKENS.voice,
      response_format: { type: 'json_schema', json_schema: { strict: true, schema } },
    });
  });

  it('asks for plain text when no schema is given', async () => {
    fetchMock.mockResolvedValueOnce(answer('DAIRY'));

    await expect(generateWithFallback('categorize', 'p', { parse: asText })).resolves.toBe('DAIRY');
    expect(requestBodies(fetchMock)[0].response_format).toBeUndefined();
  });

  it('moves to the next model when one is out of quota', async () => {
    fetchMock.mockResolvedValueOnce(httpError(429)).mockResolvedValueOnce(answer('DAIRY'));

    await expect(generateWithFallback('categorize', 'p', { parse: asText })).resolves.toBe('DAIRY');
    expect(modelsAsked(fetchMock)).toEqual(AI_MODELS.slice(0, 2));
  });

  it('moves to the next model when parse rejects an answer', async () => {
    fetchMock.mockResolvedValueOnce(answer('bad')).mockResolvedValueOnce(answer('good'));
    const parse = (text: string) => {
      if (text !== 'good') throw new Error('malformed');
      return text;
    };

    await expect(generateWithFallback('recipe', 'p', { parse })).resolves.toBe('good');
  });

  it('rejects with the HTTP status first when every model fails', async () => {
    fetchMock.mockImplementation(async () => httpError(429));

    await expect(generateWithFallback('recipe', 'p', { parse: asText })).rejects.toThrow(/^429 /);
    expect(modelsAsked(fetchMock)).toEqual(AI_MODELS);
  });

  it('stops at a cut-off answer instead of paying another model', async () => {
    fetchMock.mockResolvedValueOnce(answer('{"title": "Cut o', 'length'));

    await expect(generateWithFallback('recipe', 'p', { parse: asText })).rejects.toBeInstanceOf(
      OutputCapError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('moves on when a response is not a chat completion', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{"unexpected":true}', { status: 200 }))
      .mockResolvedValueOnce(answer('DAIRY'));

    await expect(generateWithFallback('categorize', 'p', { parse: asText })).resolves.toBe('DAIRY');
  });

  it('refuses to call the API without a key', async () => {
    vi.stubEnv('GROQ_API_KEY', '');

    await expect(generateWithFallback('categorize', 'p', { parse: asText })).rejects.toThrow(
      /GROQ_API_KEY/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
