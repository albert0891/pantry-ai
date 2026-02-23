import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// ---------------------------------------------------------------------------
// Design Pattern Note: Middleware / Interceptor (Backend)
//
// To secure the API, we need to verify the token sent by the client.
// We use the `aws-jwt-verify` library to securely unpack and cryptographically 
// verify the Cognito JWT token without making a round-trip to the AWS servers.
// ---------------------------------------------------------------------------

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
  tokenUse: "id", // We expect the ID token from Amplify
  clientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID!,
});

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
    // Design Pattern Note: Context Injection
    //
    // We intercept every request here. We look for the 'Authorization: Bearer <token>' 
    // header sent by our frontend ApolloProvider. If the token is valid, we extract 
    // the user's `sub` (Subject ID) from Cognito and pass it to every resolver.
    // ---------------------------------------------------------------------------
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await verifier.verify(token);
        userId = payload.sub; // The unique Cognito user ID
      } catch (err) {
        console.warn("Invalid or expired token provided to GraphQL API", err);
      }
    }

    return { req, userId };
  },
});

// Export the handler for both GET and POST requests (required by App Router)
export { handler as GET, handler as POST };
