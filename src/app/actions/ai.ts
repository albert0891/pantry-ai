'use server';

import { GoogleGenAI } from '@google/genai';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const VALID_CATEGORIES = ["PRODUCE", "DAIRY", "MEAT", "PANTRY", "FROZEN", "BEVERAGE", "OTHER"];

export async function categorizeItem(name: string): Promise<string> {
  if (!name.trim()) return "OTHER";
  if (!ai) {
    console.warn("No GEMINI_API_KEY found, falling back to OTHER.");
    return "OTHER";
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
    
    const text = response.text?.trim().toUpperCase() || "OTHER";
    
    if (VALID_CATEGORIES.includes(text)) {
      return text;
    }
    return "OTHER";
  } catch (error) {
    console.error("Auto categorization failed:", error);
    return "OTHER";
  }
}
