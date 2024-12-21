'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginResponse {
  token?: string;
  user?: {
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
    goals?: string[];
    business_goals?: string[];
    store_domain?: string;
    website?: string;
    brand_name?: string;
  };
  available_fields: string[];
}

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    try {
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

      if (!response.ok) {
        throw new Error(loginResult.error || 'Login failed');
      }

      // Store the auth token
      if (loginResult.token) {
        localStorage.setItem('auth_token', loginResult.token);
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

        if (!hasName) {
          router.push('/onboarding');
          return;
        }
        
        if (!hasGoals) {
          router.push('/onboarding/goals');
          return;
        }
        
        if (!hasStore) {
          router.push('/onboarding/connect-store');
          return;
        }

        // If all onboarding is complete, go to dashboard
        router.push('/dashboard');
      } else {
        // If we can't check onboarding status, assume it's not complete
        router.push('/onboarding');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-purple-400">thinkr</div>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className="hover:text-purple-400 transition-colors py-2">Home</Link>
          <Link href="/pricing" className="hover:text-purple-400 transition-colors py-2">Pricing</Link>
          <Link href="/faqs" className="hover:text-purple-400 transition-colors py-2">FAQs</Link>
        </div>
      </nav>

      {/* Login Form */}
      <main className="flex flex-col items-center justify-center px-8 pt-20 pb-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-gray-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
} 