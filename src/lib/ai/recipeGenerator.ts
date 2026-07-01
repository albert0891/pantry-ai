import { GoogleGenAI } from '@google/genai';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export const buildRecipePrompt = (mustUseIngredients: string[], supportingIngredients: string[], previouslyUsedIngredients?: string[]) => {
  const mustUseList = mustUseIngredients.join(', ');
  const supportingList = supportingIngredients.join(', ');
  
  let prompt = `You are a Michelin-star chef creating a highly rated recipe.

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
    You may still use the same pantry items if needed, but the dish must feel distinct. 
    DO NOT violate the CRITICAL FLAVOR RULE just to make it different! NEVER force incompatible ingredients together.`;
  }
    
  prompt += `\n\nCRITICAL LANGUAGE RULE: 
    If any of the provided ingredients contain Chinese characters, you MUST output the entire recipe (title, ingredients, instructions) in Traditional Chinese (繁體中文). 
    Otherwise, if all ingredients are in English, output the recipe in English.

    Return the recipe strictly in JSON format matching this schema. Note the 'unused_ingredients' field: use it to list any PANTRY INVENTORY items you chose NOT to include, so you can discard them safely:
    {
      "title": "Recipe Title",
      "ingredients": ["1 cup ingredient", "2 tbsp oil"],
      "instructions": ["Step 1", "Step 2"],
      "unused_ingredients": ["item 1", "item 2"]
    }`;
  
  return prompt;
};

export async function generateRecipeWithAI(mustUseIngredients: string[], supportingIngredients: string[], previouslyUsedIngredients?: string[]) {
  if (!ai) {
    throw new Error("GoogleGenAI is not initialized. Check your GEMINI_API_KEY environment variable.");
  }

  const prompt = buildRecipePrompt(mustUseIngredients, supportingIngredients, previouslyUsedIngredients);
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
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
        instructions: result.instructions,
        unused_ingredients: result.unused_ingredients || []
      };
    } catch (err: any) {
        console.warn(`[Gemini API] Attempt ${attempt} failed:`, err.message);
        lastError = err;
        
        // Exponential backoff to handle 429 Rate Limits
        if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1500));
        }
    }
  }

  console.error("Gemini API Error (All retries exhausted):", lastError);
  
  // Provide a more descriptive error if it's likely a rate limit
  if (lastError?.message?.includes("429") || lastError?.message?.toLowerCase().includes("quota")) {
      throw new Error("API Rate Limit Exceeded: The free tier is busy. Please wait a minute and try again.");
  }
  
  throw new Error("AI is currently feeling uninspired or busy. Please try again.");
}
