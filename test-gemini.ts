import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ParsedItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive().optional(),
  category: z.string().optional(),
  expiryDate: z.string().optional(),
});

async function main() {
  console.log('Starting...');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Parse this: 買三百克豬肉',
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

    console.log('Response:', response.text);

    let text = response.text?.trim();
    if (!text) return null;

    text = text
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    const parsedJson = JSON.parse(text);
    console.log('Parsed JSON:', parsedJson);
    const result = ParsedItemSchema.parse(parsedJson);
    console.log('Zod Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
