import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Design Pattern Note: Adapter Pattern
// 
// Apollo Server is framework agnostic (it can run on Express, Fastify, Next.js).
// To make it work inside the Next.js App Router, we use `startServerAndCreateNextHandler`.
// This acts as an Adapter pattern, translating Next.js Request/Response objects 
// into standard HTTP objects that Apollo Server understands natively.
// ---------------------------------------------------------------------------

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create the adapted handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    // ---------------------------------------------------------------------------
    // Design Pattern Note: Middleware / Interceptor Pattern
    //
    // Similar to an HttpInterceptor in Angular, we can intercept every request
    // here to decode the incoming AWS Cognito JWT and attach the User to the GraphQL 
    // Context. Every resolver will then have access to the authenticated user.
    // ---------------------------------------------------------------------------
    return { req }; // Placeholder until Phase 4 Auth
  },
});

// Export the handler for both GET and POST requests (required by App Router)
export { handler as GET, handler as POST };
