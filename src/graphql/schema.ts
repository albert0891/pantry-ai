import gql from 'graphql-tag';

// ---------------------------------------------------------------------------
// Design Pattern Note: Schema-First API Design
//
// In GraphQL, we define the "Contract" first. This is similar to defining
// an Interface in C# / .NET. The frontend and backend both agree on this shape.
// Any client requesting data that doesn't match this schema will be rejected,
// ensuring strict type safety across the network boundary.
// ---------------------------------------------------------------------------

export const typeDefs = gql`
  # A day on the calendar as YYYY-MM-DD, with no time and no time zone.
  scalar CalendarDate

  # Enum mapping directly to our Prisma Category enum
  enum Category {
    PRODUCE
    DAIRY
    MEAT
    PANTRY
    FROZEN
    BEVERAGE
    OTHER
  }

  enum BoardState {
    TO_BUY
    IN_PANTRY
    CONSUMED
  }

  type User {
    id: ID!
    cognitoId: String!
    items: [PantryItem!]!
  }

  type PantryItem {
    id: ID!
    name: String!
    quantity: Int!
    unit: String
    category: Category!
    expiryDate: CalendarDate
    imageUrl: String
    boardState: BoardState!
  }

  type Recipe {
    id: ID!
    title: String!
    ingredients: [String!]!
    instructions: [String!]!
    createdAt: String!
  }

  type NutritionInfo {
    calories: Int!
    servings: Int!
    protein: Float!
    carbs: Float!
    fat: Float!
    fiber: Float
    dietary_tags: [String!]!
    dietitian_tip: String!
    healthy_swaps: [String!]
  }

  # Item fields the AI extracted from a voice transcript. Only name is guaranteed.
  type ParsedPantryItem {
    name: String!
    quantity: Int
    category: Category
    expiryDate: CalendarDate
  }

  type GeneratedRecipe {
    title: String!
    ingredients: [String!]!
    instructions: [String!]!
    unused_ingredients: [String!]
    nutrition: NutritionInfo
  }

  # The root Query type defines all GET operations (Read)
  type Query {
    hello: String
    myPantryItems: [PantryItem!]!
    myRecipes: [Recipe!]!
  }

  # The root Mutation type defines all POST/PUT/DELETE operations (Write)
  type Mutation {
    addPantryItem(
      name: String!
      quantity: Int!
      unit: String
      category: Category
      expiryDate: CalendarDate
      boardState: BoardState
    ): PantryItem!

    editPantryItem(
      id: ID!
      name: String!
      quantity: Int!
      unit: String
      category: Category!
      expiryDate: CalendarDate
    ): PantryItem!

    deletePantryItem(id: ID!): Boolean!

    updateItemState(id: ID!, newState: BoardState!): PantryItem!

    moveItem(id: ID!, amount: Int!, targetState: BoardState!): PantryItem!

    generateRecipe(
      mustUseItemIds: [String!]!
      previouslyUsedIngredients: [String!]
    ): GeneratedRecipe!

    # AI helpers for the item form. Mutations rather than queries because every
    # call consumes rate-limit quota, so it must never be served from a cache.
    categorizeItem(name: String!): Category!

    # today is the user's local date, so that "expires tomorrow" means tomorrow for them.
    parseVoiceInput(transcript: String!, today: CalendarDate): ParsedPantryItem!

    saveRecipe(title: String!, ingredients: [String!]!, instructions: [String!]!): Recipe!

    deleteRecipe(id: ID!): Boolean!
  }
`;
