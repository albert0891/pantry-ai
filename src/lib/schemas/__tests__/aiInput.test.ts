import { describe, it, expect } from 'vitest';
import {
  CategorizeItemArgsSchema,
  GenerateRecipeArgsSchema,
  ParseVoiceInputArgsSchema,
  toPromptNames,
} from '../aiInput';
import { AI_INPUT_LIMITS, ITEM_NAME_MAX_LENGTH } from '../../constants/limits';

const ids = (count: number) => Array.from({ length: count }, (_, i) => `item-${i}`);

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('GenerateRecipeArgsSchema', () => {
  it('accepts between 1 and the max number of must-use items', () => {
    expect(GenerateRecipeArgsSchema.safeParse({ mustUseItemIds: ids(1) }).success).toBe(true);
    expect(
      GenerateRecipeArgsSchema.safeParse({ mustUseItemIds: ids(AI_INPUT_LIMITS.mustUseItems) })
        .success,
    ).toBe(true);
  });

  it('rejects an empty selection and too many items with a readable message', () => {
    expect(firstMessage(GenerateRecipeArgsSchema.safeParse({ mustUseItemIds: [] }))).toBe(
      'Pick at least one ingredient.',
    );
    expect(
      firstMessage(
        GenerateRecipeArgsSchema.safeParse({
          mustUseItemIds: ids(AI_INPUT_LIMITS.mustUseItems + 1),
        }),
      ),
    ).toBe(`Pick up to ${AI_INPUT_LIMITS.mustUseItems} ingredients for one recipe.`);
  });

  it('treats previouslyUsedIngredients as optional (missing or null)', () => {
    expect(GenerateRecipeArgsSchema.safeParse({ mustUseItemIds: ids(1) }).success).toBe(true);
    expect(
      GenerateRecipeArgsSchema.safeParse({
        mustUseItemIds: ids(1),
        previouslyUsedIngredients: null,
      }).success,
    ).toBe(true);
  });

  it('caps the count and length of previouslyUsedIngredients', () => {
    const ok = {
      mustUseItemIds: ids(1),
      previouslyUsedIngredients: Array(AI_INPUT_LIMITS.previousIngredients).fill(
        'x'.repeat(AI_INPUT_LIMITS.previousIngredientLength),
      ),
    };
    expect(GenerateRecipeArgsSchema.safeParse(ok).success).toBe(true);

    const tooMany = {
      ...ok,
      previouslyUsedIngredients: [...ok.previouslyUsedIngredients, 'salt'],
    };
    expect(GenerateRecipeArgsSchema.safeParse(tooMany).success).toBe(false);

    const tooLong = {
      ...ok,
      previouslyUsedIngredients: ['x'.repeat(AI_INPUT_LIMITS.previousIngredientLength + 1)],
    };
    expect(GenerateRecipeArgsSchema.safeParse(tooLong).success).toBe(false);
  });

  it('rejects an oversized item id (ids are never this long)', () => {
    expect(GenerateRecipeArgsSchema.safeParse({ mustUseItemIds: ['x'.repeat(65)] }).success).toBe(
      false,
    );
  });
});

describe('CategorizeItemArgsSchema', () => {
  it('allows an empty name, so the resolver can answer OTHER without the AI', () => {
    expect(CategorizeItemArgsSchema.parse({ name: '   ' }).name).toBe('');
  });

  it('enforces the item name limit', () => {
    expect(
      CategorizeItemArgsSchema.safeParse({ name: 'a'.repeat(ITEM_NAME_MAX_LENGTH) }).success,
    ).toBe(true);
    expect(
      CategorizeItemArgsSchema.safeParse({ name: 'a'.repeat(ITEM_NAME_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });
});

describe('ParseVoiceInputArgsSchema', () => {
  it('trims the transcript and rejects an empty one', () => {
    expect(ParseVoiceInputArgsSchema.parse({ transcript: '  兩盒雞蛋 ' }).transcript).toBe(
      '兩盒雞蛋',
    );
    expect(firstMessage(ParseVoiceInputArgsSchema.safeParse({ transcript: '  ' }))).toBe(
      "Didn't catch that. Please try again.",
    );
  });

  it('enforces the transcript length limit', () => {
    const max = AI_INPUT_LIMITS.voiceTranscriptLength;
    expect(ParseVoiceInputArgsSchema.safeParse({ transcript: 'a'.repeat(max) }).success).toBe(true);
    expect(ParseVoiceInputArgsSchema.safeParse({ transcript: 'a'.repeat(max + 1) }).success).toBe(
      false,
    );
  });
});

describe('toPromptNames', () => {
  it('trims, drops blanks, and removes duplicates', () => {
    expect(toPromptNames([' Milk ', 'Milk', '', '   ', 'Eggs'])).toEqual(['Milk', 'Eggs']);
  });

  it('cuts names saved before the limit existed', () => {
    const [name] = toPromptNames(['a'.repeat(ITEM_NAME_MAX_LENGTH + 20)]);
    expect(name).toHaveLength(ITEM_NAME_MAX_LENGTH);
  });
});
