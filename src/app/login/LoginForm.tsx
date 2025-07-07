'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import HybridLayout from '@/components/HybridLayout';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const reason = searchParams.get('reason');
  const { login, isLoading, error: loginError } = useAuth(redirectPath);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    await login(email, password);
  };

  return (
    <HybridLayout>
      <div className="bg-[#141718] w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-[40px] text-white font-normal mb-1">
            Welcome back.
          </h2>
          <p className="text-white text-lg">
            Sign in to your account.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {(loginError || reason === 'session_expired') && (
              <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shadow-sm">
                {reason === 'session_expired' 
                  ? 'Your session has expired. Please log in again.'
                  : loginError
                }
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-[#7B7B7B] mb-2">
                Email address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-[4px] border-0 py-2.5 px-3 bg-[#2C2C2E] text-white outline-none focus:outline-none ring-1 ring-transparent focus:ring-[#8C74FF] sm:text-sm transition-all duration-200 [&:-webkit-autofill]:bg-[#2C2C2E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0_30px_#2C2C2E_inset]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm text-[#7B7B7B]">
                  Password
                </label>
                <div className="text-sm">
                  <Link href="/forgot-password" className="text-[#7B7B7B] hover:text-[#8C74FF] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-[4px] border-0 py-2.5 px-3 bg-[#2C2C2E] text-white outline-none focus:outline-none ring-1 ring-transparent focus:ring-[#8C74FF] sm:text-sm transition-all duration-200 [&:-webkit-autofill]:bg-[#2C2C2E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0_30px_#2C2C2E_inset]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full justify-center rounded-[4px] px-3 py-2.5 text-base font-normal text-white transition-all duration-200 ${
                  isLoading
                    ? 'bg-[#8C74FF]/50 cursor-not-allowed'
                    : 'bg-[#8C74FF] hover:bg-[#8C74FF]/90'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4">
            <p className="text-sm text-[#7B7B7B] mb-3">
              Don't have an account?
            </p>
            <Link 
              href="/register" 
              className="flex w-full justify-center rounded-[4px] bg-[#BA90FF] px-3 py-2.5 text-base font-normal text-white hover:bg-[#BA90FF]/90 transition-all duration-200"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </HybridLayout>
  );
} 