import { z } from 'zod';

export const VALID_CATEGORIES = [
  'PRODUCE',
  'DAIRY',
  'MEAT',
  'PANTRY',
  'FROZEN',
  'BEVERAGE',
  'OTHER',
];

export const ParsedItemSchema = z.object({
  name: z.coerce.string().min(1, 'Name is required'),
  quantity: z.coerce.number().positive().optional(),
  category: z.coerce.string().optional(),
  expiryDate: z.coerce.string().optional(),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;
