import { GenerateContentConfig, GoogleGenAI, Type } from '@google/genai';
import { AI_ATTEMPT_TIMEOUT_MS, GEMINI_MODELS, MAX_OUTPUT_TOKENS } from './config';
import type { AiFeature } from '../rateLimit/aiRateLimitPolicy';
import {
  ParsedItem,
  ParsedItemSchema,
  VALID_CATEGORIES,
  normalizeParsedItem,
} from '../schemas/pantry';
import { getWeekdayName } from '../dates/calendarDate';
import { CATEGORY_LIST } from '../constants/categories';

// ---------------------------------------------------------------------------
// AI helpers for the item form (auto-categorize and voice fill).
//
// These used to be Server Actions. Server Actions are public HTTP endpoints
// that never see the user's Bearer token (it lives in localStorage and is only
// attached by Apollo), so they could not be authenticated or rate limited.
// They are now plain server functions, called only from GraphQL resolvers
// after the auth and rate-limit checks.
// ---------------------------------------------------------------------------

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const VOICE_PARSE_FAILED = "Couldn't understand that. Please try again.";
const VOICE_BUSY = 'AI is busy right now. Please try again, or fill in the form yourself.';
const CATEGORIZE_FAILED = 'AI is busy right now. Please pick a category yourself.';

// The same one-line descriptions users see in the category dropdown, so the AI and
// the form agree on what each category means. Without them the AI guesses, and files
// coffee beans under PANTRY. The longer `examples` lists stay out to keep prompts short.
const CATEGORY_GUIDE = CATEGORY_LIST.map(({ id, tagline }) => `- ${id}: ${tagline}`).join('\n');

/** Builds the auto-categorize prompt for an item name. */
export function buildCategorizePrompt(name: string): string {
  return `Classify the grocery item "${name}" into exactly ONE of the following categories:
${CATEGORY_GUIDE}

Rules:
- Respond with ONLY the exact category name in all uppercase.
- No markdown, no punctuation, no extra words.
- If unsure, respond with OTHER.`;
}

/**
 * Asks each model in GEMINI_MODELS in turn, moving on when one is overloaded, out
 * of quota, or over the time limit. Rejects with the last error if none answers.
 */
async function generateWithFallback(
  client: GoogleGenAI,
  feature: AiFeature,
  contents: string,
  config: GenerateContentConfig = {},
) {
  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await client.models.generateContent({
        model,
        contents,
        config: {
          ...config,
          maxOutputTokens: MAX_OUTPUT_TOKENS[feature],
          // Not httpOptions.timeout: that also sends the deadline to Gemini, which
          // rejects anything under 10 s. This one is enforced on our side only.
          abortSignal: AbortSignal.timeout(AI_ATTEMPT_TIMEOUT_MS[feature]),
        },
      });
    } catch (error) {
      console.error(`Gemini ${feature} call failed on ${model}:`, error);
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * Suggests a category for an item name, moving to the next model if one is
 * overloaded or too slow. Throws an Error whose message is safe to show to the
 * user when no model answers: replying OTHER would look like a real suggestion and
 * replace the correct category of an item being edited.
 */
export async function categorizeItemWithAI(name: string): Promise<string> {
  if (!ai) {
    console.warn('No GEMINI_API_KEY found, auto-categorize is unavailable.');
    throw new Error('Auto-categorize is not available right now. Please pick a category yourself.');
  }

  let answer: string | undefined;
  try {
    const response = await generateWithFallback(ai, 'categorize', buildCategorizePrompt(name));
    answer = response.text;
  } catch {
    throw new Error(CATEGORIZE_FAILED);
  }

  // The model did answer, so an unusable reply is its way of saying "not sure".
  const text = answer?.trim().toUpperCase() || 'OTHER';
  return VALID_CATEGORIES.includes(text) ? text : 'OTHER';
}

/** Builds the voice parsing prompt. `today` is the user's date, as YYYY-MM-DD. */
export function buildVoicePrompt(transcript: string, today: string): string {
  return `You are a smart grocery assistant. Parse the following voice transcript from a user adding an item to their pantry.
Extract the relevant fields and return a strict JSON object.

Transcript: "${transcript}"

Rules:
1. "name" (string, required): The core item name. IF the user mentions a weight or volume measurement (e.g., "250g", "兩百五十克", "500ml", "半斤"), you MUST append this measurement directly to the name (e.g., "絞肉 250克" or "Minced Pork 250g").
2. "quantity" (number, optional): ONLY for discrete countable units (e.g., "3顆蘋果" -> 3, "兩盒" -> 2). If the input is primarily a weight/volume (like "兩百五十克絞肉"), set quantity to 1. Default to 1 if not explicitly countable.
3. "category" (string, optional): Classify into exactly ONE of these categories, going by their descriptions. If unsure, omit.
${CATEGORY_GUIDE}
4. "expiryDate" (string, optional): If they mention when it expires (e.g., "下週三過期", "expires in 3 days"), calculate the exact date in YYYY-MM-DD format. Assume today is ${getWeekdayName(today)}, ${today}. Be precise with day of week calculations.

Respond ONLY with a valid JSON object. No markdown formatting, no backticks.
Example 1: "買三百克豬肉下禮拜過期" -> {"name": "豬肉 300克", "quantity": 1, "category": "MEAT", "expiryDate": "2026-07-11"}
Example 2: "Milk" -> {"name": "Milk", "quantity": 1, "category": "DAIRY"}`;
}

/**
 * Extracts item fields from a voice transcript. `today` is the user's date, as
 * YYYY-MM-DD, so that "expires tomorrow" means tomorrow for them.
 * Throws an Error whose message is safe to show to the user; details are logged.
 */
export async function parseVoiceInputWithAI(
  transcript: string,
  today: string,
): Promise<ParsedItem> {
  if (!ai) {
    console.warn('No GEMINI_API_KEY found, voice input is unavailable.');
    throw new Error('Voice input is not available right now.');
  }

  let text: string | undefined;
  try {
    // A cut-off answer is invalid JSON and falls through to VOICE_PARSE_FAILED below.
    const response = await generateWithFallback(ai, 'voice', buildVoicePrompt(transcript, today), {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          category: { type: Type.STRING },
          expiryDate: { type: Type.STRING },
        },
        required: ['name'],
      },
    });
    text = response.text?.trim();
  } catch {
    // Reaching this point says nothing about the user's speech: no model answered.
    throw new Error(VOICE_BUSY);
  }

  if (!text) throw new Error(VOICE_PARSE_FAILED);

  try {
    // In case the model wraps the JSON in markdown despite instructions
    const json = JSON.parse(
      text
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '')
        .trim(),
    );
    const item = normalizeParsedItem(ParsedItemSchema.parse(json));
    if (!item.name) throw new Error('Parsed item has an empty name');
    return item;
  } catch (error) {
    console.error('Voice parsing returned invalid data:', error);
    throw new Error(VOICE_PARSE_FAILED);
  }
}
