// ---------------------------------------------------------------------------
// Input size limits, shared by the item form (client) and the API (server).
//
// These strings end up inside paid AI prompts, and every prompt token is
// billed, so an unbounded input is an unbounded bill. Each limit sits far above
// real usage (the longest item name in the database is 16 characters), so
// normal users never notice them. This file has no dependencies so the client
// can import it without pulling Zod into the bundle.
// ---------------------------------------------------------------------------

export const ITEM_NAME_MAX_LENGTH = 100;

export const AI_INPUT_LIMITS = {
  /** Ingredients the user can tick for one recipe. */
  mustUseItems: 10,
  /** Other pantry items offered to the recipe prompt, soonest expiry first. */
  supportingItems: 30,
  /** Ingredients sent back from the previous recipe when asking for a different one. */
  previousIngredients: 40,
  previousIngredientLength: 200,
  voiceTranscriptLength: 300,
} as const;
