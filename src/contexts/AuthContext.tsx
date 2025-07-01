import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: any;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const authFetch = useAuthFetch();

  const checkAuth = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`);
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
        router.replace('/');
      } else {
        console.error('Auth check error:', response.status);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      // Only log non-abort errors to reduce console noise
      if (error.name !== 'AbortError') {
        console.error('Auth check error:', error);
        if (error.message?.includes('401')) {
          setIsAuthenticated(false);
          setUser(null);
          router.replace('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 