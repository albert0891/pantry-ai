import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

export const NutritionSchema = z.object({
  calories: z
    .number()
    .nonnegative()
    .transform((val) => Math.round(val)),
  servings: z
    .number()
    .positive()
    .default(1)
    .transform((val) => Math.round(val)),
  protein: z
    .number()
    .nonnegative()
    .transform((val) => Math.round(val * 10) / 10),
  carbs: z
    .number()
    .nonnegative()
    .transform((val) => Math.round(val * 10) / 10),
  fat: z
    .number()
    .nonnegative()
    .transform((val) => Math.round(val * 10) / 10),
  fiber: z
    .number()
    .nonnegative()
    .optional()
    .nullable()
    .transform((val) => (val != null ? Math.round(val * 10) / 10 : null)),
  dietary_tags: z.array(z.string()).default([]),
  dietitian_tip: z.string().min(1, 'Dietitian tip is required'),
  healthy_swaps: z.array(z.string()).optional().default([]),
});

export type NutritionInfo = z.infer<typeof NutritionSchema>;

export const RecipeSchema = z.object({
  title: z.string().min(1, 'Recipe title is required'),
  ingredients: z.array(z.string()).min(1, 'Ingredients are required'),
  instructions: z.array(z.string()).min(1, 'Instructions are required'),
  unused_ingredients: z.array(z.string()).optional(),
  nutrition: NutritionSchema.optional().nullable(),
});

export type GeneratedRecipe = z.infer<typeof RecipeSchema>;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export const buildRecipePrompt = (
  mustUseIngredients: string[],
  supportingIngredients: string[],
  previouslyUsedIngredients?: string[],
) => {
  const mustUseList = mustUseIngredients.join(', ');
  const supportingList = supportingIngredients.join(', ');

  let prompt = `You are a world-class Michelin-star chef and certified clinical nutritionist creating a healthy, highly rated recipe.

CORE REQUIREMENT: You MUST feature these primary ingredients prominently: [${mustUseList}].
You MUST generate an AUTHENTIC, globally recognized dish. Do not invent weird or non-existent dishes.`;

  if (supportingIngredients.length > 0) {
    prompt += `\n\nPANTRY INVENTORY: The user also has these ingredients in their kitchen: [${supportingList}].
YOUR TASK: Select ONLY the ingredients from the PANTRY INVENTORY that naturally and classically pair with the primary ingredients.
HARD LIMIT: You may select a MAXIMUM of 3 supporting ingredients. Less is more.
CRITICAL FLAVOR RULE: You MUST IGNORE ingredients that clash in flavor. For example, NEVER mix sweet baking ingredients (like cocoa powder, sugar, vanilla) with savory meats unless you are making a culturally established dish (like Mexican Mole or Chili con Carne). 
It is MUCH BETTER to use fewer ingredients and create a delicious, normal dish than to create a weird, unappetizing combination just to use up pantry items. Do not force items together!`;
  }

  prompt += `\n\nYou may also assume the user has basic kitchen staples (salt, pepper, cooking oil, water, garlic, etc.).`;

  if (previouslyUsedIngredients && previouslyUsedIngredients.length > 0) {
    prompt += `\n\nIMPORTANT: The user wants a DIFFERENT recipe. The previous recipe used these ingredients: [${previouslyUsedIngredients.join(', ')}]. 
Please invent a completely new dish (e.g., different cuisine style, different cooking method, or different flavor profile) that STILL features the REQUIRED primary ingredients.
PRO TIP: To make the dish distinct, STRONGLY CONSIDER incorporating DIFFERENT ingredients from the PANTRY INVENTORY that you didn't use last time! (For example, if you ignored some meats or veggies last time, try to build a dish around them now, as long as flavors don't clash).
DO NOT violate the CRITICAL FLAVOR RULE just to make it different! NEVER force incompatible ingredients together.`;
  }

  prompt += `\n\nAI NUTRITIONIST REQUIREMENT:
As a certified nutritionist, calculate realistic nutritional estimates per single serving:
1. Estimate total calories in kcal (integer), servings count (default 1), protein (g), carbohydrates (g), fat (g), and dietary fiber (g).
2. Assign 2 to 4 concise dietary tags describing the meal (e.g., 'High Protein', 'Low Carb', 'High Fiber', 'Heart Healthy', 'Keto Friendly', or in Traditional Chinese if applicable).
3. Provide a 'dietitian_tip' (1 to 2 sentences) highlighting the key nutritional benefits and why this combination works well.
4. Provide 1 to 2 actionable 'healthy_swaps' (optional ingredient or preparation adjustments to lower calories or boost nutrients).`;

  prompt += `\n\nCRITICAL LANGUAGE RULE: 
If any of the provided ingredients contain Chinese characters, you MUST output the entire recipe (title, ingredients, instructions, dietary_tags, dietitian_tip, healthy_swaps) in Traditional Chinese (繁體中文). 
Otherwise, if all ingredients are in English, output the entire recipe in English.

Note the 'unused_ingredients' field: use it to list any PANTRY INVENTORY items you chose NOT to include, so you can discard them safely.`;

  return prompt;
};

export async function generateRecipeWithAI(
  mustUseIngredients: string[],
  supportingIngredients: string[],
  previouslyUsedIngredients?: string[],
) {
  if (!ai) {
    throw new Error(
      'GoogleGenAI is not initialized. Check your GEMINI_API_KEY environment variable.',
    );
  }

  const prompt = buildRecipePrompt(
    mustUseIngredients,
    supportingIngredients,
    previouslyUsedIngredients,
  );
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              unused_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              nutrition: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.INTEGER },
                  servings: { type: Type.INTEGER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  fiber: { type: Type.NUMBER },
                  dietary_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dietitian_tip: { type: Type.STRING },
                  healthy_swaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'calories',
                  'servings',
                  'protein',
                  'carbs',
                  'fat',
                  'dietary_tags',
                  'dietitian_tip',
                ],
              },
            },
            required: ['title', 'ingredients', 'instructions', 'nutrition'],
          },
        },
      });

      const jsonText = response.text || '{}';
      const result = JSON.parse(jsonText);

      return RecipeSchema.parse(result);
    } catch (err: unknown) {
      console.warn(
        `[Gemini API] Attempt ${attempt} failed:`,
        err instanceof Error ? err.message : String(err),
      );
      lastError = err instanceof Error ? err : new Error(String(err));

      // Exponential backoff to handle 429 Rate Limits
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  console.error('Gemini API Error (All retries exhausted):', lastError);

  // Provide a more descriptive error if it's likely a rate limit
  if (lastError?.message?.includes('429') || lastError?.message?.toLowerCase().includes('quota')) {
    throw new Error(
      'API Rate Limit Exceeded: The free tier is busy. Please wait a minute and try again.',
    );
  }

  throw new Error('AI is currently feeling uninspired or busy. Please try again.');
}
