export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  examples: string[];
  badgeColor: string;
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryDefinition> = {
  PRODUCE: {
    id: 'PRODUCE',
    name: 'Produce',
    icon: '🍎',
    tagline: 'Fresh fruits, vegetables, and culinary herbs',
    description: 'Perishable fresh plant foods typically kept refrigerated or in cool dry storage.',
    examples: [
      'Apples',
      'Bananas',
      'Spinach',
      'Carrots',
      'Garlic',
      'Tomatoes',
      'Avocados',
      'Onions',
    ],
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  DAIRY: {
    id: 'DAIRY',
    name: 'Dairy',
    icon: '🧀',
    tagline: 'Milk, cheese, yogurt, butter, and eggs',
    description:
      'Refrigerated dairy goods and animal byproducts that require constant cold storage.',
    examples: [
      'Whole Milk',
      'Cheddar Cheese',
      'Greek Yogurt',
      'Butter',
      'Heavy Cream',
      'Eggs',
      'Sour Cream',
    ],
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  MEAT: {
    id: 'MEAT',
    name: 'Meat',
    icon: '🥩',
    tagline: 'Poultry, beef, pork, seafood, and tofu',
    description:
      'Fresh or cured protein sources including poultry, red meats, fish, and plant proteins.',
    examples: [
      'Chicken Breast',
      'Ground Beef',
      'Salmon Fillet',
      'Pork Chops',
      'Firm Tofu',
      'Bacon',
      'Shrimp',
    ],
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  PANTRY: {
    id: 'PANTRY',
    name: 'Pantry',
    icon: '🥫',
    tagline: 'Grains, pasta, canned goods, oils, and spices',
    description:
      'Shelf-stable dry ingredients, seasonings, condiments, and non-perishable canned staples.',
    examples: [
      'Rice',
      'Pasta',
      'Olive Oil',
      'Canned Beans',
      'Soy Sauce',
      'Flour',
      'Spices',
      'Honey',
    ],
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  FROZEN: {
    id: 'FROZEN',
    name: 'Frozen',
    icon: '❄️',
    tagline: 'Frozen meals, vegetables, desserts, and pizzas',
    description: 'Items requiring deep-freeze storage to preserve texture and freshness.',
    examples: [
      'Ice Cream',
      'Frozen Peas',
      'Dumplings',
      'Frozen Berries',
      'Frozen Pizza',
      'Waffles',
    ],
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  BEVERAGE: {
    id: 'BEVERAGE',
    name: 'Beverage',
    icon: '🥤',
    tagline: 'Coffee, tea, juices, sodas, and drinks',
    description: 'Liquid refreshments, drink powders, bottled beverages, and spirits.',
    examples: [
      'Orange Juice',
      'Sparkling Water',
      'Coffee Beans',
      'Green Tea',
      'Soda',
      'Wine',
      'Beer',
    ],
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  OTHER: {
    id: 'OTHER',
    name: 'Other',
    icon: '📦',
    tagline: 'Snacks, bakery, household, and miscellaneous',
    description:
      'Items that do not fit standard pantry groups, such as household goods or pet supplies.',
    examples: [
      'Bread',
      'Chips',
      'Paper Towels',
      'Dog Food',
      'Dish Soap',
      'Protein Bars',
      'Vitamins',
    ],
    badgeColor: 'bg-stone-50 text-stone-800 border-stone-200',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_DEFINITIONS);

export function getCategoryDefinition(categoryKey: string): CategoryDefinition {
  return CATEGORY_DEFINITIONS[categoryKey] || CATEGORY_DEFINITIONS.OTHER;
}
