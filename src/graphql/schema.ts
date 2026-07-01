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
    email: String!
    items: [PantryItem!]!
  }

  type PantryItem {
    id: ID!
    name: String!
    quantity: Int!
    unit: String
    category: Category!
    expiryDate: String
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

  type GeneratedRecipe {
    title: String!
    ingredients: [String!]!
    instructions: [String!]!
    unused_ingredients: [String!]
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
      expiryDate: String
      boardState: BoardState
    ): PantryItem!
    
    editPantryItem(
      id: ID!
      name: String!
      quantity: Int!
      unit: String
      category: Category!
      expiryDate: String
    ): PantryItem!

    deletePantryItem(id: ID!): Boolean!
    
    updateItemState(id: ID!, newState: BoardState!): PantryItem!
    
    moveItem(id: ID!, amount: Int!, targetState: BoardState!): PantryItem!
    
    generateRecipe(mustUseItemIds: [String!]!, previouslyUsedIngredients: [String!]): GeneratedRecipe!
    
    saveRecipe(
      title: String!
      ingredients: [String!]!
      instructions: [String!]!
    ): Recipe!
    
    deleteRecipe(id: ID!): Boolean!
  }
`;
