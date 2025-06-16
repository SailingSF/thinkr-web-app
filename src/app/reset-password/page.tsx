'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import HybridLayout from '@/components/HybridLayout';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const uidParam = searchParams.get('uid');
    const tokenParam = searchParams.get('token');
    
    if (!uidParam || !tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    setUid(uidParam);
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (value: string) => {
    const hasMinLength = value.length >= 8;
    const hasNumber = /\d/.test(value);
    const hasLetter = /[a-zA-Z]/.test(value);

    if (!hasMinLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasNumber || !hasLetter) {
      return 'Password must contain letters and numbers';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!uid || !token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uid,
          token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      if (data.success) {
        // Store the new auth token if provided
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        setSuccess(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while resetting your password');
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
                Password reset successful
              </h2>
              <p className="text-[#7B7B7B] text-base mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push('/app')}
                className="w-full flex justify-center rounded-[4px] bg-[#8C74FF] px-3 py-2.5 text-base font-normal text-white hover:bg-[#8C74FF]/90 transition-all duration-200"
              >
                Continue to app
              </button>
            </div>
          </div>
        </div>
      </HybridLayout>
    );
  }

  if (!uid || !token) {
    return (
      <HybridLayout>
        <div className="min-h-[calc(100vh-64px)] bg-[#1A1B1E] flex flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 mb-6">
                <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-[32px] text-white font-normal mb-4">
                Invalid reset link
              </h2>
              <p className="text-[#7B7B7B] text-base mb-8">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <div className="space-y-4">
                <Link 
                  href="/forgot-password"
                  className="block w-full text-center rounded-[4px] bg-[#8C74FF] px-3 py-2.5 text-base font-normal text-white hover:bg-[#8C74FF]/90 transition-all duration-200"
                >
                  Request new reset link
                </Link>
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
            Reset password
          </h2>
          <p className="text-[#8C74FF] text-lg">
            Enter your new password.
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
              <label htmlFor="password" className="block text-sm text-[#7B7B7B] mb-2">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                className="block w-full rounded-[4px] border-0 py-2.5 px-3 bg-[#2C2C2E] text-white outline-none focus:outline-none ring-1 ring-transparent focus:ring-[#8C74FF] sm:text-sm transition-all duration-200"
              />
              {password && (
                <div className="mt-3">
                  <p className="text-sm text-[#7B7B7B]">Password requirements:</p>
                  <ul className="mt-2 text-sm space-y-1.5 text-[#7B7B7B] list-disc pl-4">
                    <li className={password.length >= 8 ? 'text-[#22C55E]' : ''}>
                      At least 8 characters long
                    </li>
                    <li className={/[a-zA-Z]/.test(password) && /\d/.test(password) ? 'text-[#22C55E]' : ''}>
                      Contains letters and numbers
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-[#7B7B7B] mb-2">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full rounded-[4px] border-0 py-2.5 px-3 bg-[#2C2C2E] text-white outline-none focus:outline-none ring-1 ring-transparent focus:ring-[#8C74FF] sm:text-sm transition-all duration-200"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-400">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !!passwordError || password !== confirmPassword || !password || !confirmPassword}
                className={`flex w-full justify-center rounded-[4px] px-3 py-2.5 text-base font-normal text-white transition-all duration-200 ${
                  isLoading || !!passwordError || password !== confirmPassword || !password || !confirmPassword
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
                    Resetting password...
                  </div>
                ) : (
                  'Reset password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
} 