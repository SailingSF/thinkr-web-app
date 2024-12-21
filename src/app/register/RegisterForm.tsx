'use client';

import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';
    const firstName = formData.get('first_name')?.toString() || '';
    const lastName = formData.get('last_name')?.toString() || '';
    const contactEmail = formData.get('contact_email')?.toString();

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
          contact_email: contactEmail || email,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
            First Name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">
            Last Name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
          />
        </div>

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
          />
        </div>

        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-300">
            Contact Email (optional)
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
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
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
} 