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

  # The root Query type defines all GET operations (Read)
  type Query {
    hello: String
    myPantryItems: [PantryItem!]!
  }

  # The root Mutation type defines all POST/PUT/DELETE operations (Write)
  type Mutation {
    addPantryItem(
      name: String!
      quantity: Int!
      unit: String
      category: Category
      expiryDate: String
    ): PantryItem!
    
    deletePantryItem(id: ID!): Boolean!
    
    updateItemState(id: ID!, newState: BoardState!): PantryItem!
  }
`;
