'use client';

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { ApolloProvider as RealApolloProvider } from '@apollo/client/react';
import { SetContextLink } from '@apollo/client/link/context';
import { fetchAuthSession } from 'aws-amplify/auth';
import React from 'react';

// ---------------------------------------------------------------------------
// Design Pattern Note: Interceptor Pattern & Provider Pattern
//
// 1. Interceptor (`authLink`): Just like an HTTP Interceptor in Angular,
//    we intercept every outgoing GraphQL request. We ask AWS Amplify for the
//    current user's JWT token and attach it to the `Authorization` header.
//
// 2. Provider (`ApolloProvider`): Just like `AuthProvider`, this is the
//    Provider Pattern. We wrap the app in this so any component can run a
//    GraphQL query without needing to know *how* to connect to the API.
// ---------------------------------------------------------------------------

// 1. Point Apollo to our Next.js API route we built in Phase 3
const httpLink = new HttpLink({
  uri: '/api/graphql',
});

// 2. The Interceptor logic using SetContextLink (Modern Approach)
// Note: SetContextLink takes (prevContext, operation) as opposed to the deprecated setContext function
const authLink = new SetContextLink(async (prevContext, _operation) => {
  try {
    const isMockLoggedIn = localStorage.getItem('mock_logged_in');
    if (isMockLoggedIn) {
      const mockToken = localStorage.getItem('auth_token');
      if (mockToken === 'demo_token') {
        return {
          headers: {
            ...prevContext.headers,
            authorization: `Bearer demo_token`,
          },
        };
      }
    }
    // Attempt to grab AWS Cognito session token
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    return {
      headers: {
        ...prevContext.headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (_e) {
    // If not logged in, just send standard headers
    return { headers: prevContext.headers };
  }
});

// 3. Assemble the client with Global Error Handling
const errorLink = onError(({ error }) => {
  if (error && error.message.includes('Unauthorized')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_logged_in');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

// 4. The Provider Component
export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <RealApolloProvider client={client}>{children}</RealApolloProvider>;
}
