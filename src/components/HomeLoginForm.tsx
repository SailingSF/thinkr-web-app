'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HomeLoginForm() {
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
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold text-white mb-2">Welcome back</h1>
      <p className="text-purple-400 mb-8">Sign in to your account.</p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {(loginError || reason === 'session_expired') && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {reason === 'session_expired' 
              ? 'Your session has expired. Please log in again.'
              : loginError
            }
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 bg-[#25262b] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 bg-[#25262b] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-md transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-purple-400 hover:text-purple-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
} 