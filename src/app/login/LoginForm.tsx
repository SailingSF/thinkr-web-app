'use client';

import { useState, useEffect } from 'react';
import { useHybridNavigation, isShopifyEmbedded } from '@/utils/shopify';
import HybridLayout from '@/components/HybridLayout';
import { useSearchParams } from 'next/navigation';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    contact_email: string;
    shopify_user_id: number;
    store: string | null;
  };
  error?: string;
}

interface OnboardingResponse {
  data: {
    name?: string;
    business_goals?: string[];
  };
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { navigate } = useHybridNavigation();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const reason = searchParams.get('reason');

  useEffect(() => {
    // Show appropriate message based on redirect reason
    if (reason === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [reason]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    try {
      console.log('Attempting login...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginResult = await response.json() as LoginResponse;
      console.log('Login result:', loginResult);

      if (!response.ok) {
        throw new Error(loginResult.error || 'Login failed');
      }

      // Store the auth token and user data in standalone mode
      if (!isShopifyEmbedded()) {
        if (loginResult.token) {
          console.log('Setting auth token:', loginResult.token.substring(0, 10) + '...');
          localStorage.setItem('auth_token', loginResult.token);
          // Set it as a cookie for middleware with explicit attributes
          document.cookie = `auth_token=${loginResult.token}; path=/; SameSite=Lax`;
          console.log('Current cookies:', document.cookie);
        }
        if (loginResult.user) {
          localStorage.setItem('user_data', JSON.stringify(loginResult.user));
        }
      }

      // If there's a redirect path, use it directly
      if (redirectPath) {
        console.log('Redirecting to:', decodeURIComponent(redirectPath));
        navigate(decodeURIComponent(redirectPath));
        return;
      }

      // Otherwise, check onboarding status
      console.log('Checking onboarding status...');
      const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding-data/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${loginResult.token}`,
        },
      });
      
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json() as OnboardingResponse;
        console.log('Onboarding data:', onboardingData);
        
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

        console.log('Navigating to:', nextPage);
        navigate(nextPage);
      } else {
        console.log('Failed to get onboarding data, redirecting to /onboarding');
        // If we can't check onboarding status, assume it's not complete
        navigate('/onboarding');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HybridLayout>
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 bg-[#25262b] text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-purple-400 hover:text-purple-300">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 bg-[#25262b] text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                  isLoading
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-400">
            Not a member?{' '}
            <a href="/register" className="font-semibold leading-6 text-purple-400 hover:text-purple-300">
              Register now
            </a>
          </p>
        </div>
      </div>
    </HybridLayout>
  );
} 