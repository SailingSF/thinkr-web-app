'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddStoreResponse {
  success: boolean;
  error?: string;
  details?: string;
}

export default function OnboardingConnectStore() {
  const router = useRouter();
  const [storeDomain, setStoreDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeDomain.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Clean up store domain and add myshopify.com if needed
      const cleanDomain = storeDomain.trim().toLowerCase();
      const fullDomain = cleanDomain.includes('.myshopify.com') 
        ? cleanDomain 
        : `${cleanDomain}.myshopify.com`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/add-store/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ store_domain: fullDomain }),
      });

      const data = await response.json() as AddStoreResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to connect store');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Connect store error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect store');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Connect your store</h1>
        <p className="text-xl text-purple-400">Last step! Let&apos;s connect your Shopify store</p>
      </div>

      <div className="bg-[#25262b] p-8 rounded-xl border border-purple-400/20">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">Quick and secure connection</h3>
              <p className="text-gray-400 mt-2">
                Enter your Shopify store name
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                placeholder="your-store"
                className="w-full p-3 bg-[#2c2d32] rounded-lg border border-gray-700 focus:border-purple-400 focus:outline-none"
                required
              />
              <p className="text-sm text-gray-400 text-center">.myshopify.com</p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !storeDomain.trim()}
              className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect Store'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-400">- OR -</p>
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/shopify/auth`}
            className="block w-full py-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors text-lg font-medium text-center"
          >
            Connect via Shopify OAuth
          </a>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-transparent hover:bg-gray-800 rounded font-medium transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
} 