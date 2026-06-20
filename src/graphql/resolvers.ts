import { prisma } from '../lib/prisma';
import { Category } from '@prisma/client';

// ---------------------------------------------------------------------------
// Educational Note: Resolvers in GraphQL
//
// If the Schema is the "Interface", Resolvers are the "Implementation".
// They provide the instructions for turning a GraphQL operation (Query/Mutation)
// into data. Unlike a REST endpoint controller that must return a fixed JSON object,
// a resolver dictates exactly how to fetch only the fields the client asked for.
// ---------------------------------------------------------------------------

export const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL in Next.js!',
    
    // We will secure this with Context later, for now we return all items
    myPantryItems: async () => {
      return await prisma.pantryItem.findMany({
        orderBy: { expiryDate: 'asc' },
      });
    },
  },
  Mutation: {
    addPantryItem: async (_: unknown, args: { name: string, quantity: number, unit?: string, category?: Category, expiryDate?: string }) => {
      // ---------------------------------------------------------------------------
      // Educational Note: GraphQL Args vs Body Parser
      // 
      // In Angular/.NET you would parse req.body or use a DTO.
      // In GraphQL, mutations strongly type the incoming arguments and pass them 
      // directly as the second parameter (`args`).
      // ---------------------------------------------------------------------------
      
      // Temporary stub for userId until AWS Cognito Auth Context is wired in Phase 4
      const stubUserId = "SYSTEM"; 
      
      // Upsert a test user if it doesn't exist so foreign keys don't fail
      const user = await prisma.user.upsert({
        where: { cognitoId: stubUserId },
        update: {},
        create: {
          cognitoId: stubUserId,
          email: "test@pantry.local"
        }
      });

      return await prisma.pantryItem.create({
        data: {
          name: args.name,
          quantity: args.quantity,
          unit: args.unit,
          category: args.category || 'OTHER',
          ...(args.expiryDate && { expiryDate: new Date(args.expiryDate) }),
          userId: user.id
        }
      });
    },
    
    deletePantryItem: async (_: unknown, { id }: { id: string }) => {
      await prisma.pantryItem.delete({
        where: { id }
      });
      return true;
    },

    updateItemState: async (_: unknown, args: { id: string, newState: 'TO_BUY' | 'IN_PANTRY' | 'CONSUMED' }) => {
      return await prisma.pantryItem.update({
        where: { id: args.id },
        data: { boardState: args.newState }
      });
    }
  }
};
