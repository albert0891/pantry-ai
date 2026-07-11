'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, AuthUser } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/amplify-config';
import { useRouter, usePathname } from 'next/navigation';

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
  userEmail: string | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

// 3. Create the Context (with a default empty state)
const AuthContext = createContext<AuthContextType>({
  user: null,
  userEmail: null,
  isLoading: true,
  refreshAuth: async () => {},
});

// 4. Create the Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkUser = async () => {
    try {
      const isMockLoggedIn = localStorage.getItem('mock_logged_in');
      if (isMockLoggedIn) {
        const token = localStorage.getItem('auth_token');
        if (token === 'demo_token') {
          setUser({ username: 'Demo User', userId: 'Demo User' } as any);
          setUserEmail('demo@pantry.ai');
        } else {
          setUser(null);
          setUserEmail(null);
        }
      } else {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        try {
          const { fetchUserAttributes } = await import('aws-amplify/auth');
          const attributes = await fetchUserAttributes();
          setUserEmail(attributes.email || null);
        } catch (e) {
          console.error('Failed to fetch user attributes', e);
        }
      }
    } catch (_error) {
      setUser(null);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  // 路由保護 (Route Guard)
  useEffect(() => {
    if (!isLoading) {
      // 如果未登入且不在登入頁，強制跳轉到登入頁
      if (!user && pathname !== '/login') {
        router.push('/login');
      }
      // 如果已登入但在登入頁，強制跳轉到首頁
      else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  // 如果還在確認身份，先不渲染畫面以防止畫面閃爍
  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50/50 flex items-center justify-center font-bold text-sky-600">
        Verifying Identity...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userEmail, isLoading, refreshAuth: checkUser }}>
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
