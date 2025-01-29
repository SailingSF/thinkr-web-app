'use client';

import { useState } from 'react';
import { useHybridNavigation, isShopifyEmbedded } from '@/utils/shopify';
import { LoginResponse } from '@/types/auth';
import { useLocalStorage } from './useLocalStorage';

// Define the onboarding data structure
interface OnboardingData {
  how_much_time_on_business?: string;
  where_ai_helps?: string[];
  business_goals?: string[];
  [key: string]: any; // Allow for other fields
}

interface OnboardingResponse {
  data: OnboardingData;
  available_fields: string[];
}

// Define required onboarding fields and their corresponding pages
const REQUIRED_ONBOARDING_FIELDS = [
  { field: 'how_much_time_on_business', page: '/onboarding/time' },
  { field: 'where_ai_helps', page: '/onboarding/ai-help' },
  { field: 'business_goals', page: '/onboarding/goals' },
] as const;

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
  const { clearStoredData } = useLocalStorage();

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
      
      if (!onboardingResponse.ok) {
        // If we can't fetch onboarding data, direct to first onboarding page
        navigate(REQUIRED_ONBOARDING_FIELDS[0].page);
        return;
      }

      const onboardingData = await onboardingResponse.json() as OnboardingResponse;
      
      // Find the first missing required field
      const missingField = REQUIRED_ONBOARDING_FIELDS.find(
        ({ field }) => !onboardingData.data?.[field]
      );

      if (missingField) {
        // Redirect to the page for the first missing field
        navigate(missingField.page);
      } else {
        // All required fields are present, send them to the app
        navigate('/app');
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
      // Clear app data
      clearStoredData();
    }
    // Redirect to home page
    navigate('/');
  };

  return { login, logout, isLoading, error };
} 