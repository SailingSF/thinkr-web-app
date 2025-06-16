'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HybridLayout from '@/components/HybridLayout';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/password-reset/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          reset_base_url: `${window.location.origin}/reset-password`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      if (data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while sending the reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <HybridLayout>
        <div className="min-h-[calc(100vh-64px)] bg-[#1A1B1E] flex flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-6">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[32px] text-white font-normal mb-4">
                Check your email
              </h2>
              <p className="text-[#7B7B7B] text-base mb-6">
                We've sent a password reset link to <span className="text-white">{email}</span>
              </p>
              <p className="text-[#7B7B7B] text-sm mb-8">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full flex justify-center rounded-[4px] bg-[#8C74FF] px-3 py-2.5 text-base font-normal text-white hover:bg-[#8C74FF]/90 transition-all duration-200"
                >
                  Try again
                </button>
                <Link 
                  href="/login"
                  className="block w-full text-center rounded-[4px] border border-[#2C2C2E] px-3 py-2.5 text-base font-normal text-white hover:bg-[#2C2C2E] transition-all duration-200"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </HybridLayout>
    );
  }

  return (
    <HybridLayout>
      <div className="min-h-[calc(100vh-64px)] bg-[#1A1B1E] flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-[40px] text-white font-normal mb-1">
            Forgot password?
          </h2>
          <p className="text-[#8C74FF] text-lg">
            Enter your email to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shadow-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-[#7B7B7B] mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-[4px] border-0 py-2.5 px-3 bg-[#2C2C2E] text-white outline-none focus:outline-none ring-1 ring-transparent focus:ring-[#8C74FF] sm:text-sm transition-all duration-200 [&:-webkit-autofill]:bg-[#2C2C2E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0_30px_#2C2C2E_inset]"
              />
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
                    Sending reset email...
                  </div>
                ) : (
                  'Send reset email'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-[#7B7B7B]">
              Remember your password?{' '}
              <Link href="/login" className="text-[#8C74FF] hover:text-[#8C74FF]/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </HybridLayout>
  );
} 