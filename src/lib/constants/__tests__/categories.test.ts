import { describe, it, expect } from 'vitest';
import { CATEGORY_DEFINITIONS, CATEGORY_LIST, getCategoryDefinition } from '../categories';
import { VALID_CATEGORIES } from '../../schemas/pantry';

describe('Category Constants and Helpers', () => {
  it('covers all valid categories defined in pantry schema', () => {
    for (const validCat of VALID_CATEGORIES) {
      expect(CATEGORY_DEFINITIONS[validCat]).toBeDefined();
      expect(CATEGORY_DEFINITIONS[validCat].id).toBe(validCat);
    }
  });

  it('ensures each category has complete descriptive metadata and examples', () => {
    for (const def of CATEGORY_LIST) {
      expect(def.name).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.tagline).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.badgeColor).toBeTruthy();
      expect(Array.isArray(def.examples)).toBe(true);
      expect(def.examples.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('returns appropriate category definition or falls back to OTHER', () => {
    const produce = getCategoryDefinition('PRODUCE');
    expect(produce.name).toBe('Produce');
    expect(produce.icon).toBe('🍎');

    const unknown = getCategoryDefinition('NON_EXISTENT_CAT');
    expect(unknown.id).toBe('OTHER');
    expect(unknown.name).toBe('Other');
  });
});
