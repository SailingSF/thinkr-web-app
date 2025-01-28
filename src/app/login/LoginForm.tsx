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
      <div className="min-h-[calc(100vh-64px)] bg-[#242424] flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-2xl lg:text-3xl font-bold text-white text-center tracking-tight">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(loginError || reason === 'session_expired') && (
              <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shadow-sm">
                {reason === 'session_expired' 
                  ? 'Your session has expired. Please log in again.'
                  : loginError
                }
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#7B7B7B] mb-sm">
                Email address
              </label>
              <div className="mt-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border-0 py-md px-md shadow-sm ring-1 ring-inset ring-[#8C74FF]/20 placeholder:text-[#7B7B7B] focus:ring-2 focus:ring-inset focus:ring-[#8C74FF] sm:text-sm bg-[#242424] text-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-sm">
                <label htmlFor="password" className="block text-sm font-medium text-[#7B7B7B]">
                  Password
                </label>
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-[#8C74FF] hover:text-[#8C74FF]/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-sm">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border-0 py-md px-md shadow-sm ring-1 ring-inset ring-[#8C74FF]/20 placeholder:text-[#7B7B7B] focus:ring-2 focus:ring-inset focus:ring-[#8C74FF] sm:text-sm bg-[#242424] text-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full justify-center rounded-lg px-6 py-3 text-base font-medium text-white shadow-md transition-all duration-200 ${
                  isLoading
                    ? 'bg-[#8C74FF]/50 cursor-not-allowed'
                    : 'bg-[#8C74FF] hover:bg-[#8C74FF]/90 shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30'
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

          <p className="mt-10 text-center text-sm text-[#7B7B7B]">
            Not a member?{' '}
            <Link href="/register" className="font-medium text-[#8C74FF] hover:text-[#8C74FF]/80 transition-colors">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </HybridLayout>
  );
} 