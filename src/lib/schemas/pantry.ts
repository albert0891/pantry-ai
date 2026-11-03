import { z } from 'zod';
import { ITEM_NAME_MAX_LENGTH } from '../constants/limits';

export const VALID_CATEGORIES = [
  'PRODUCE',
  'DAIRY',
  'MEAT',
  'PANTRY',
  'FROZEN',
  'BEVERAGE',
  'OTHER',
];

export const ITEM_NAME_TOO_LONG = `Item name must be ${ITEM_NAME_MAX_LENGTH} characters or fewer.`;

/** Item name as stored on a PantryItem (add / edit). */
export const ItemNameSchema = z
  .string()
  .trim()
  .min(1, 'Item name is required.')
  .max(ITEM_NAME_MAX_LENGTH, ITEM_NAME_TOO_LONG);

export const ParsedItemSchema = z.object({
  name: z.coerce.string().min(1, 'Name is required'),
  quantity: z.coerce.number().positive().optional(),
  category: z.coerce.string().optional(),
  expiryDate: z.coerce.string().optional(),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Shapes AI-parsed fields into what the GraphQL API accepts: a whole-number
 * quantity (PantryItem.quantity is an Int), a known category, a YYYY-MM-DD
 * date, and a name within the item name limit. Invalid optional fields are
 * corrected or dropped instead of failing the whole parse, so the user keeps
 * whatever the AI did understand.
 */
export function normalizeParsedItem(item: ParsedItem): ParsedItem {
  // Cut rather than reject: the user can still edit the name before saving.
  const normalized: ParsedItem = { name: item.name.trim().slice(0, ITEM_NAME_MAX_LENGTH) };

  if (item.quantity !== undefined) {
    normalized.quantity = Math.max(1, Math.round(item.quantity));
  }
  if (item.category) {
    const category = item.category.trim().toUpperCase();
    normalized.category = VALID_CATEGORIES.includes(category) ? category : 'OTHER';
  }
  if (item.expiryDate && ISO_DATE.test(item.expiryDate)) {
    normalized.expiryDate = item.expiryDate;
  }

  return normalized;
}
