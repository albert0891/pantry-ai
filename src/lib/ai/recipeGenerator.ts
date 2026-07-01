import { GoogleGenAI } from '@google/genai';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export const buildRecipePrompt = (ingredients: string[], previouslyUsedIngredients?: string[]) => {
  const ingredientsList = ingredients.join(', ');
  let prompt = `You are an expert chef. I have these ingredients: ${ingredientsList}.
    Please generate a delicious recipe using these items. You may include other common pantry staples (like salt, oil, water, etc.) if needed.`;

  if (previouslyUsedIngredients && previouslyUsedIngredients.length > 0) {
    prompt += `\n\nIMPORTANT: The user wants a DIFFERENT recipe. Try to DE-PRIORITIZE these specific supporting ingredients: ${previouslyUsedIngredients.join(', ')}. 
    Focus on finding a DIFFERENT recipe utilizing OTHER available ingredients from my list, while STILL using the REQUIRED ingredients.`;
  }
    
  prompt += `\n\nCRITICAL LANGUAGE RULE: 
    If any of the provided ingredients contain Chinese characters, you MUST output the entire recipe (title, ingredients, instructions) in Traditional Chinese (繁體中文). 
    Otherwise, if all ingredients are in English, output the recipe in English.

    Return the recipe strictly in JSON format matching this schema:
    {
      "title": "Recipe Title",
      "ingredients": ["1 cup ingredient", "2 tbsp oil"],
      "instructions": ["Step 1", "Step 2"]
    }`;
  
  return prompt;
};

export async function generateRecipeWithAI(ingredients: string[], previouslyUsedIngredients?: string[]) {
  if (!ai) {
    throw new Error("GoogleGenAI is not initialized. Check your GEMINI_API_KEY environment variable.");
  }

  const prompt = buildRecipePrompt(ingredients, previouslyUsedIngredients);
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const jsonText = response.text || "{}";
      const result = JSON.parse(jsonText);
      
      if (!result.title || typeof result.title !== 'string') {
          throw new Error("Missing or invalid 'title' in JSON response");
      }
      if (!Array.isArray(result.ingredients) || result.ingredients.length === 0) {
          throw new Error("Missing or invalid 'ingredients' array in JSON response");
      }
      if (!Array.isArray(result.instructions) || result.instructions.length === 0) {
          throw new Error("Missing or invalid 'instructions' array in JSON response");
      }

      return {
        title: result.title,
        ingredients: result.ingredients,
        instructions: result.instructions
      };
    } catch (err: any) {
        console.warn(`[Gemini API] Attempt ${attempt} failed:`, err.message);
        lastError = err;
    }
  }

  console.error("Gemini API Error (All retries exhausted):", lastError);
  throw new Error("AI is currently feeling uninspired or busy. Please try again.");
}
