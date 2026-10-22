import { describe, it, expect } from 'vitest';
import { RecipeSchema, NutritionSchema } from '../recipeGenerator';

describe('RecipeSchema', () => {
  it('should parse a valid complete recipe without nutrition (backward compatibility)', () => {
    const validData = {
      title: 'Pasta al Pomodoro',
      ingredients: ['1 lb pasta', '2 cups tomato sauce', 'basil'],
      instructions: ['Boil water', 'Cook pasta', 'Mix with sauce'],
      unused_ingredients: ['chicken'],
    };
    const result = RecipeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should parse a valid recipe with complete nutrition facts', () => {
    const validWithNutrition = {
      title: 'Mediterranean Grilled Chicken Salad',
      ingredients: ['200g chicken breast', '1 cup mixed greens', '1 tbsp olive oil'],
      instructions: ['Grill chicken', 'Toss greens with oil', 'Top with sliced chicken'],
      unused_ingredients: ['flour'],
      nutrition: {
        calories: 380,
        servings: 1,
        protein: 42,
        carbs: 8,
        fat: 18,
        fiber: 4,
        dietary_tags: ['High Protein', 'Low Carb', 'Mediterranean'],
        dietitian_tip:
          'Excellent lean protein paired with healthy monounsaturated fats from olive oil.',
        healthy_swaps: ['Substitute olive oil spray to reduce total calories.'],
      },
    };
    const result = RecipeSchema.safeParse(validWithNutrition);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nutrition?.calories).toBe(380);
      expect(result.data.nutrition?.protein).toBe(42);
      expect(result.data.nutrition?.dietary_tags).toHaveLength(3);
    }
  });

  it('should fail if title is missing', () => {
    const missingTitle = {
      ingredients: ['1 lb pasta'],
      instructions: ['Boil water'],
    };
    const result = RecipeSchema.safeParse(missingTitle);
    expect(result.success).toBe(false);
  });

  it('should fail if ingredients array is empty', () => {
    const emptyIngredients = {
      title: 'Air',
      ingredients: [],
      instructions: ['Breathe in', 'Breathe out'],
    };
    const result = RecipeSchema.safeParse(emptyIngredients);
    expect(result.success).toBe(false);
  });

  it('should fail if instructions array is empty', () => {
    const emptyInstructions = {
      title: 'Raw Onion',
      ingredients: ['1 onion'],
      instructions: [],
    };
    const result = RecipeSchema.safeParse(emptyInstructions);
    expect(result.success).toBe(false);
  });
});

describe('NutritionSchema', () => {
  it('should validate full nutrition object', () => {
    const validNutrition = {
      calories: 450,
      servings: 2,
      protein: 30,
      carbs: 45,
      fat: 15,
      fiber: 6,
      dietary_tags: ['High Fiber', 'Balanced'],
      dietitian_tip: 'A well balanced meal with complex carbs and lean protein.',
      healthy_swaps: ['Use brown rice instead of white rice for more sustained energy.'],
    };

    const parsed = NutritionSchema.safeParse(validNutrition);
    expect(parsed.success).toBe(true);
  });

  it('should fail if mandatory macro numbers are missing', () => {
    const missingProtein = {
      calories: 300,
      servings: 1,
      carbs: 50,
      fat: 10,
      dietary_tags: ['Quick'],
      dietitian_tip: 'Simple dish.',
    };

    const parsed = NutritionSchema.safeParse(missingProtein);
    expect(parsed.success).toBe(false);
  });
});
