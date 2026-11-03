import { z } from 'zod';
import { AI_INPUT_LIMITS, ITEM_NAME_MAX_LENGTH } from '../constants/limits';
import { ITEM_NAME_TOO_LONG } from './pantry';

// ---------------------------------------------------------------------------
// Argument schemas for the AI mutations. Resolvers parse their args with these
// before charging rate-limit quota, so an oversized request is rejected for
// free and never reaches the model. Messages are shown to the user as-is.
// ---------------------------------------------------------------------------

export const GenerateRecipeArgsSchema = z.object({
  mustUseItemIds: z
    .array(z.string().max(64))
    .min(1, 'Pick at least one ingredient.')
    .max(
      AI_INPUT_LIMITS.mustUseItems,
      `Pick up to ${AI_INPUT_LIMITS.mustUseItems} ingredients for one recipe.`,
    ),
  previouslyUsedIngredients: z
    .array(z.string().max(AI_INPUT_LIMITS.previousIngredientLength))
    .max(AI_INPUT_LIMITS.previousIngredients)
    .nullish(),
});

// An empty name is allowed here: the resolver answers OTHER without calling the AI.
export const CategorizeItemArgsSchema = z.object({
  name: z.string().trim().max(ITEM_NAME_MAX_LENGTH, ITEM_NAME_TOO_LONG),
});

export const ParseVoiceInputArgsSchema = z.object({
  transcript: z
    .string()
    .trim()
    .min(1, "Didn't catch that. Please try again.")
    .max(
      AI_INPUT_LIMITS.voiceTranscriptLength,
      'That was too long. Please describe one item at a time.',
    ),
});

/**
 * Cleans pantry item names before they go into a prompt: trimmed, no blanks or
 * duplicates, and cut to the item name limit (rows saved before the limit
 * existed can be longer).
 */
export function toPromptNames(names: string[]): string[] {
  const cleaned = names.map((name) => name.trim().slice(0, ITEM_NAME_MAX_LENGTH)).filter(Boolean);
  return [...new Set(cleaned)];
}
