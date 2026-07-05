'use server';

import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const VALID_CATEGORIES = ['PRODUCE', 'DAIRY', 'MEAT', 'PANTRY', 'FROZEN', 'BEVERAGE', 'OTHER'];

export async function categorizeItem(name: string): Promise<string> {
  if (!name.trim()) return 'OTHER';
  if (!ai) {
    console.warn('No GEMINI_API_KEY found, falling back to OTHER.');
    return 'OTHER';
  }

  const prompt = `Classify the grocery item "${name}" into exactly ONE of the following categories:
${VALID_CATEGORIES.join(', ')}

Rules:
- Respond with ONLY the exact category name in all uppercase.
- No markdown, no punctuation, no extra words.
- If unsure, respond with OTHER.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });

    const text = response.text?.trim().toUpperCase() || 'OTHER';

    if (VALID_CATEGORIES.includes(text)) {
      return text;
    }
    return 'OTHER';
  } catch (error) {
    console.error('Auto categorization failed:', error);
    return 'OTHER';
  }
}

export const ParsedItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive().optional(),
  category: z.string().optional(),
  expiryDate: z.string().optional(),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;

export async function parseVoiceInput(transcript: string): Promise<ParsedItem | null> {
  if (!transcript.trim()) return null;
  if (!ai) {
    console.warn('No GEMINI_API_KEY found, returning null.');
    return null;
  }

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  const dayOfWeek = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const prompt = `You are a smart grocery assistant. Parse the following voice transcript from a user adding an item to their pantry.
Extract the relevant fields and return a strict JSON object.

Transcript: "${transcript}"

Rules:
1. "name" (string, required): The core item name. IF the user mentions a weight or volume measurement (e.g., "250g", "兩百五十克", "500ml", "半斤"), you MUST append this measurement directly to the name (e.g., "絞肉 250克" or "Minced Pork 250g").
2. "quantity" (number, optional): ONLY for discrete countable units (e.g., "3顆蘋果" -> 3, "兩盒" -> 2). If the input is primarily a weight/volume (like "兩百五十克絞肉"), set quantity to 1. Default to 1 if not explicitly countable.
3. "category" (string, optional): Classify into exactly ONE of: ${VALID_CATEGORIES.join(', ')}. If unsure, omit.
4. "expiryDate" (string, optional): If they mention when it expires (e.g., "下週三過期", "expires in 3 days"), calculate the exact date in YYYY-MM-DD format. Assume today is ${dayOfWeek}, ${todayStr}. Be precise with day of week calculations.

Respond ONLY with a valid JSON object. No markdown formatting, no backticks.
Example 1: "買三百克豬肉下禮拜過期" -> {"name": "豬肉 300克", "quantity": 1, "category": "MEAT", "expiryDate": "2026-07-11"}
Example 2: "Milk" -> {"name": "Milk", "quantity": 1, "category": "DAIRY"}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
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
      },
    });

    let text = response.text?.trim();
    if (!text) return null;

    // In case model wraps in markdown despite instructions
    text = text
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    const parsedJson = JSON.parse(text);
    return ParsedItemSchema.parse(parsedJson);
  } catch (error) {
    console.error('Smart Voice parsing failed:', error);
    return null;
  }
}
