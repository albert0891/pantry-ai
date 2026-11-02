import { describe, it, expect } from 'vitest';
import { ParsedItemSchema, VALID_CATEGORIES, normalizeParsedItem } from '../pantry';

describe('ParsedItemSchema', () => {
  it('should parse a valid complete object (Happy Path)', () => {
    const validData = {
      name: 'Apples',
      quantity: 5,
      category: 'PRODUCE',
      expiryDate: '2026-12-31',
    };
    const result = ParsedItemSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should coerce string numbers into numbers', () => {
    const dataWithStringQuantity = {
      name: 'Milk',
      quantity: '2', // AI sometimes returns stringified numbers
      category: 'DAIRY',
    };
    const result = ParsedItemSchema.safeParse(dataWithStringQuantity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
      expect(typeof result.data.quantity).toBe('number');
    }
  });

  it('should fail if name is completely missing or empty', () => {
    const missingName = {
      quantity: 1,
      category: 'OTHER',
    };
    const result = ParsedItemSchema.safeParse(missingName);
    expect(result.success).toBe(false);

    const emptyName = {
      name: '   ', // Will fail min(1) if stripped, but coerce string doesn't automatically trim. We might need to trim it in practice, but let's test strict empty string.
    };
    // Zod coerce string turns undefined to "undefined".
    // Wait, let's test passing a literal empty string.
    const emptyStringName = {
      name: '',
    };
    const result2 = ParsedItemSchema.safeParse(emptyStringName);
    expect(result2.success).toBe(false);
  });

  it('should accept missing optional fields', () => {
    const justName = {
      name: 'Chicken',
    };
    const result = ParsedItemSchema.safeParse(justName);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Chicken');
      expect(result.data.quantity).toBeUndefined();
      expect(result.data.category).toBeUndefined();
      expect(result.data.expiryDate).toBeUndefined();
    }
  });

  it('should fail if quantity is a negative number', () => {
    const negativeQuantity = {
      name: 'Salt',
      quantity: -1,
    };
    const result = ParsedItemSchema.safeParse(negativeQuantity);
    expect(result.success).toBe(false);
  });
});

describe('normalizeParsedItem', () => {
  it('rounds quantities to whole numbers of at least 1', () => {
    expect(normalizeParsedItem({ name: 'Eggs', quantity: 2.6 }).quantity).toBe(3);
    expect(normalizeParsedItem({ name: 'Rice', quantity: 0.3 }).quantity).toBe(1);
    expect(normalizeParsedItem({ name: 'Salt' }).quantity).toBeUndefined();
  });

  it('upper-cases known categories and maps unknown ones to OTHER', () => {
    expect(normalizeParsedItem({ name: 'Milk', category: 'dairy' }).category).toBe('DAIRY');
    expect(normalizeParsedItem({ name: 'Soap', category: 'HOUSEHOLD' }).category).toBe('OTHER');
    for (const category of VALID_CATEGORIES) {
      expect(normalizeParsedItem({ name: 'x', category }).category).toBe(category);
    }
  });

  it('keeps only YYYY-MM-DD expiry dates', () => {
    expect(normalizeParsedItem({ name: 'Ham', expiryDate: '2026-11-08' }).expiryDate).toBe(
      '2026-11-08',
    );
    expect(normalizeParsedItem({ name: 'Ham', expiryDate: 'next Wednesday' })).not.toHaveProperty(
      'expiryDate',
    );
  });

  it('trims the item name', () => {
    expect(normalizeParsedItem({ name: '  Minced Pork 250g ' }).name).toBe('Minced Pork 250g');
  });
});
