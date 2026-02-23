'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, AuthUser } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/amplify-config';

// ---------------------------------------------------------------------------
// Design Pattern Note: The Provider / Context Pattern
//
// Problem: If the user logs in, how does the header know to show "Logout" 
// and the Pantry list know who is requesting data, without passing "user={user}" 
// down through 10 layers of components (called "Prop Drilling")?
//
// Solution: React Context. We create a "bubble" of state here. Any component 
// wrapped inside this Provider can simply "hook" into the state directly.
// In Angular, you achieve this by injecting a Singleton AuthService.
// ---------------------------------------------------------------------------

// 1. Initialize Amplify before anything renders
configureAmplify();

// 2. Define the shape of our Context
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

// 3. Create the Context (with a default empty state)
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshAuth: async () => {},
});

// 4. Create the Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (_error) {
      // getCurrentUser throws an error if no user is logged in. This is expected.
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect runs once when the app loads (because of the empty [] array)
  useEffect(() => {
    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshAuth: checkUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Design Pattern Note: Custom Hooks
//
// Instead of making every component import `AuthContext` and `useContext`,
// we create a helper function. This abstracts away the implementation details.
// Components simply call `const { user } = useAuth();`
// ---------------------------------------------------------------------------
export function useAuth() {
  return useContext(AuthContext);
}
