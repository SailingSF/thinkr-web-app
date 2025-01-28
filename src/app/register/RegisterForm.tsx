'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterResponse {
  success?: boolean;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    contact_email: string;
    shopify_user_id: number;
    store: string | null;
  };
  token?: string;
  error?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = (value: string) => {
    const hasMinLength = value.length >= 8;
    const hasNumber = /\d/.test(value);
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasMinDigits = (value.match(/\d/g) || []).length >= 6;

    if (!hasMinLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasNumber || !hasLetter) {
      return 'Password must contain both letters and numbers';
    }
    if (!hasMinDigits) {
      return 'Password must contain at least 6 digits';
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

    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const fullName = formData.get('full_name')?.toString() || '';
    
    // Split full name into first and last name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || ''; // Join remaining parts as last name

    // Validate that we have both first and last name
    if (!firstName || !lastName) {
      setError('Please enter both first and last name');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          contact_email: email, // Using primary email as contact email
        }),
      });

      const data = await response.json() as RegisterResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.success) {
        localStorage.setItem('auth_token', data.token || '');
        router.push('/onboarding');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-lg max-w-3xl mx-auto">
      {error && (
        <div className="p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shadow-sm">
          {error}
        </div>
      )}

      <div className="space-y-lg">
        <div className="flex flex-col lg:flex-row gap-lg">
          <div className="flex-1">
            <label htmlFor="full_name" className="block text-sm font-medium text-[#7B7B7B] mb-sm">
              What's your full name?
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="John Smith"
              required
              className="block w-full rounded-lg border-0 py-md px-md shadow-sm ring-1 ring-inset ring-[#8C74FF]/20 placeholder:text-[#7B7B7B] focus:ring-2 focus:ring-inset focus:ring-[#8C74FF] sm:text-sm bg-[#242424] text-white transition-all duration-200"
            />
          </div>

          <div className="flex-1">
            <label htmlFor="email" className="block text-sm font-medium text-[#7B7B7B] mb-sm">
              What's your email address?
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="example@thinkrapp.com"
              required
              className="block w-full rounded-lg border-0 py-md px-md shadow-sm ring-1 ring-inset ring-[#8C74FF]/20 placeholder:text-[#7B7B7B] focus:ring-2 focus:ring-inset focus:ring-[#8C74FF] sm:text-sm bg-[#242424] text-white transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-lg">
          <div className="flex-1">
            <label htmlFor="password" className="block text-sm font-medium text-[#7B7B7B] mb-sm">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              className="block w-full rounded-lg border-0 py-md px-md shadow-sm ring-1 ring-inset ring-[#8C74FF]/20 placeholder:text-[#7B7B7B] focus:ring-2 focus:ring-inset focus:ring-[#8C74FF] sm:text-sm bg-[#242424] text-white transition-all duration-200"
            />
            <div className="mt-md">
              <p className="text-sm text-[#7B7B7B]">Password requirements:</p>
              <ul className="mt-2 text-sm space-y-sm text-[#7B7B7B] list-disc pl-4">
                <li className={password.length >= 8 ? 'text-[#22C55E]' : ''}>
                  At least 8 characters long
                </li>
                <li className={/[a-zA-Z]/.test(password) && /\d/.test(password) ? 'text-[#22C55E]' : ''}>
                  Contains both letters and numbers
                </li>
                <li className={(password.match(/\d/g) || []).length >= 6 ? 'text-[#22C55E]' : ''}>
                  At least 6 digits
                </li>
              </ul>
            </div>
          </div>

          <div className="flex-1 space-y-lg">
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-[#7B7B7B] mb-sm">
                Confirm Password
              </label>
              <input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full rounded-lg border-0 py-md px-md shadow-sm ring-1 ring-inset ring-[#8C74FF]/20 placeholder:text-[#7B7B7B] focus:ring-2 focus:ring-inset focus:ring-[#8C74FF] sm:text-sm bg-[#242424] text-white transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !!passwordError || password !== confirmPassword}
              className={`w-full justify-center rounded-lg px-lg py-md text-base font-medium text-white shadow-md transition-all duration-200 ${
                isLoading || !!passwordError || password !== confirmPassword
                  ? 'bg-[#8C74FF]/50 cursor-not-allowed'
                  : 'bg-[#8C74FF] hover:bg-[#8C74FF]/90 shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
} 