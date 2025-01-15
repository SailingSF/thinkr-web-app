'use client';

import { useState } from 'react';
import { useHybridNavigation, isShopifyEmbedded } from '@/utils/shopify';
import { LoginResponse, OnboardingResponse } from '@/types/auth';

interface UseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string;
}

export function useAuth(redirectPath?: string | null): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { navigate } = useHybridNavigation();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const loginResult = await response.json() as LoginResponse;

      if (!response.ok) {
        throw new Error(loginResult.error || 'Login failed');
      }

      // Store the auth token and user data in standalone mode
      if (!isShopifyEmbedded()) {
        if (loginResult.token) {
          localStorage.setItem('auth_token', loginResult.token);
          document.cookie = `auth_token=${loginResult.token}; path=/; SameSite=Lax`;
        }
        if (loginResult.user) {
          localStorage.setItem('user_data', JSON.stringify(loginResult.user));
        }
      }

      // If there's a redirect path, use it directly
      if (redirectPath) {
        navigate(decodeURIComponent(redirectPath));
        return;
      }

      // Check onboarding status
      const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding-data/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${loginResult.token}`,
        },
      });
      
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json() as OnboardingResponse;
        
        // Check if essential onboarding fields are filled
        const hasName = Boolean(onboardingData.data?.name);
        const hasGoals = Boolean(onboardingData.data?.business_goals?.length);
        const hasStore = Boolean(loginResult.user?.store);

        // Determine the next page in the onboarding flow
        let nextPage = '/dashboard';
        if (!hasName) {
          nextPage = '/onboarding';
        } else if (!hasGoals) {
          nextPage = '/onboarding/goals';
        } else if (!hasStore) {
          nextPage = '/onboarding/connect-store';
        }

        navigate(nextPage);
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (!isShopifyEmbedded()) {
      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      // Clear the cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
    // Redirect to home page
    navigate('/');
  };

  return { login, logout, isLoading, error };
} 