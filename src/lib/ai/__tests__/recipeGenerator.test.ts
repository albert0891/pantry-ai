import { describe, it, expect } from 'vitest';
import { RecipeSchema } from '../recipeGenerator';

describe('RecipeSchema', () => {
  it('should parse a valid complete recipe', () => {
    const validData = {
      title: 'Pasta al Pomodoro',
      ingredients: ['1 lb pasta', '2 cups tomato sauce', 'basil'],
      instructions: ['Boil water', 'Cook pasta', 'Mix with sauce'],
      unused_ingredients: ['chicken'],
    };
    const result = RecipeSchema.safeParse(validData);
    expect(result.success).toBe(true);
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
