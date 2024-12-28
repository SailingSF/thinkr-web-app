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
        // Handle specific error cases with user-friendly messages
        if (data.error?.includes('not installed')) {
          throw new Error('This store does not have our app installed. Please install the app first.');
        } else if (data.error?.includes('not authorized') || data.error?.includes('permissions')) {
          throw new Error('You do not have sufficient permissions to manage this store. Please ensure you have admin access.');
        } else if (data.error?.includes('email') || data.error?.includes('verify')) {
          throw new Error('Please verify your email address before connecting a store.');
        } else {
          throw new Error(data.error || data.details || 'Failed to connect store');
        }
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
        <p className="text-xl text-purple-400">Let&apos;s connect your Shopify store to your dashboard</p>
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">Connect Store</h3>
              <p className="text-gray-400 mt-2">
                Enter your Shopify store domain to connect
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

          <div className="space-y-4 p-4 bg-[#2c2d32] rounded-lg border border-purple-400/10">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-400">Before connecting your store:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-purple-500/20 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">
                    Install our Shopify app{' '}
                    <a 
                      href="https://apps.shopify.com/your-app-name" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      here
                    </a>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-purple-500/20 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-300">
                    <p className="mb-1">Ensure you are either:</p>
                    <ul className="ml-4 space-y-1">
                      <li className="list-disc">The store owner</li>
                      <li className="list-disc">An approved staff member with admin access</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-purple-500/20 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">
                    Verify your email address if you haven&apos;t already
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 pt-2 border-t border-purple-400/10">
              Need help? Check our{' '}
              <a 
                href="/help/connecting-store" 
                className="text-purple-400 hover:text-purple-300 underline"
              >
                setup guide
              </a>
              {' '}or{' '}
              <a 
                href="/contact" 
                className="text-purple-400 hover:text-purple-300 underline"
              >
                contact support
              </a>
            </div>
          </div>
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