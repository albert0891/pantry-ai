import { z } from 'zod';
import { AI_ATTEMPT_TIMEOUT_MS, AI_MODELS, MAX_OUTPUT_TOKENS } from './config';
import type { AiFeature } from '../rateLimit/aiRateLimitPolicy';

// ---------------------------------------------------------------------------
// The only module that talks to the AI provider: Groq, through its
// OpenAI-compatible chat API. Plain fetch is enough, so no provider SDK is
// installed. Every AI feature gets the same model fallback, time limit and
// output cap from here.
// ---------------------------------------------------------------------------

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** A JSON Schema object, sent to the model as the shape its answer must have. */
export type JsonSchema = Record<string, unknown>;

/** The model stopped at MAX_OUTPUT_TOKENS, so its answer is cut off. Not worth retrying. */
export class OutputCapError extends Error {}

const ChatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable() }),
        finish_reason: z.string().nullable(),
      }),
    )
    .min(1),
});

export function isAiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

async function askModel(
  apiKey: string,
  model: string,
  feature: AiFeature,
  prompt: string,
  schema?: JsonSchema,
): Promise<string> {
  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(AI_ATTEMPT_TIMEOUT_MS[feature]),
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      // Thinking tokens count toward this cap too.
      max_completion_tokens: MAX_OUTPUT_TOKENS[feature],
      ...(schema && {
        // Strict mode makes the model follow the schema exactly, so every
        // property must be listed in `required`; optional ones are nullable.
        response_format: {
          type: 'json_schema',
          json_schema: { name: feature, strict: true, schema },
        },
      }),
    }),
  });

  if (!response.ok) {
    // Status first: callers look for 429 (quota used up) at the start.
    throw new Error(`${response.status} ${(await response.text()).slice(0, 300)}`);
  }

  const [choice] = ChatCompletionSchema.parse(await response.json()).choices;
  if (choice.finish_reason === 'length') {
    throw new OutputCapError(`Answer hit the ${MAX_OUTPUT_TOKENS[feature]}-token cap on ${model}`);
  }
  return choice.message.content ?? '';
}

interface GenerateOptions<T> {
  /** Shape the answer must follow. Without one, the model answers in plain text. */
  schema?: JsonSchema;
  /** Turns the answer into a result. When it throws, the next model is asked. */
  parse: (text: string) => T;
}

/**
 * Asks each model in AI_MODELS in turn, moving on when one fails, is out of quota,
 * runs past its time limit, or gives an answer that `parse` rejects. Rejects with
 * the last error if none answers. A cut-off answer stops at once: it means the
 * model rambled (e.g. a prompt injection in an item name), and asking another
 * model would only pay for that again.
 */
export async function generateWithFallback<T>(
  feature: AiFeature,
  prompt: string,
  { schema, parse }: GenerateOptions<T>,
): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  let lastError: unknown;
  for (const model of AI_MODELS) {
    try {
      return parse(await askModel(apiKey, model, feature, prompt, schema));
    } catch (error) {
      console.error(`AI ${feature} call failed on ${model}:`, error);
      lastError = error;
      if (error instanceof OutputCapError) break;
    }
  }
  throw lastError;
}

function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutNulls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, field]) => field !== null)
        .map(([key, field]) => [key, withoutNulls(field)]),
    );
  }
  return value;
}

/**
 * Reads a JSON answer. Strict schemas answer null for a field the model left
 * empty; those are dropped so the field reads as missing. Kept, a null would
 * reach `z.coerce.string()` and become the text "null".
 */
export function parseJsonAnswer(text: string): unknown {
  // In case the model wraps the JSON in markdown anyway.
  const json = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/, '')
    .trim();
  return withoutNulls(JSON.parse(json));
}
