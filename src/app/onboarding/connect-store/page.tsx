'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';

interface OAuthStartResponse {
  oauth_url: string;
  state: string;
  redirect: boolean;
  error?: string;
}

export default function OnboardingConnectStore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for successful connection
    const shop_connected = searchParams.get('shop_connected');
    const shop = searchParams.get('shop');

    if (shop_connected === 'true' && shop) {
      // Store was successfully connected
      localStorage.setItem('connected_store', shop);
      // Redirect to dashboard
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  const startOAuthFlow = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Include return_to parameter to specify where to redirect after successful connection
      const returnTo = `${window.location.origin}/onboarding/connect-store`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/oauth/start/?return_to=${encodeURIComponent(returnTo)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
          },
          credentials: 'include',
        }
      );

      const data = await response.json() as OAuthStartResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start OAuth process');
      }

      // Check for redirect flag and handle accordingly
      if (data.redirect && data.oauth_url) {
        // Store the state in localStorage to verify when we return
        localStorage.setItem('shopify_oauth_state', data.state);
        // Redirect to Shopify's OAuth URL
        window.location.href = data.oauth_url;
      } else {
        throw new Error('Invalid OAuth response from server');
      }
    } catch (error) {
      console.error('OAuth start error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start OAuth process');
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
                Connect your Shopify store securely using OAuth
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}

          <ShopifyConnectButton
            onClick={startOAuthFlow}
            isLoading={isLoading}
          />

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