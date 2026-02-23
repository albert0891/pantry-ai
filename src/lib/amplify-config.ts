'use client';

// ---------------------------------------------------------------------------
// Educational Note: "use client" Directive
//
// In Next.js App Router, components are "Server Components" by default. 
// They render on the backend and send raw HTML to the browser (perfect for SEO and speed).
// However, AWS Amplify needs to access browser APIs (like localStorage to save your token).
// By adding 'use client' at the top, we tell Next.js to run this specific code in the browser.
// ---------------------------------------------------------------------------

import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID!,
        identityPoolId: '', // We aren't using Identity Pools (federated identities) for this app
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: 'code',
      }
    }
  });
}
