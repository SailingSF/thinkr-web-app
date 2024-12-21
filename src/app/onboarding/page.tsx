'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingStoreInfo() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const name = formData.get('name')?.toString() || '';
    const brandName = formData.get('brand_name')?.toString() || '';
    const website = formData.get('website')?.toString() || '';

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding-data/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          updates: {
            name,
            brand_name: brandName,
            website
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save store information');
      }

      // Move to the next step
      router.push('/onboarding/goals');
    } catch (error) {
      console.error('Store info error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save store information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Let&apos;s get started</h1>
        <p className="text-xl text-purple-400">Tell us about your store</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              What&apos;s your preferred name?
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="brand_name" className="block text-sm font-medium text-gray-300">
              What&apos;s your brand name?
            </label>
            <input
              id="brand_name"
              name="brand_name"
              type="text"
              required
              className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
              placeholder="Store/Brand Name"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-300">
              Provide the URL of your website:
            </label>
            <input
              id="website"
              name="website"
              type="url"
              required
              className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
              placeholder="www.ecommercestore.com"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
} 