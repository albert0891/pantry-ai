import { Amplify } from 'aws-amplify';

// Configure AWS Amplify (v6 syntax)
export const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'dummy-pool-id',
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'dummy-client-id',
      }
    }
  });
};
