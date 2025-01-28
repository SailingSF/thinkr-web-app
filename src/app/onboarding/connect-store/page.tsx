'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import Link from 'next/link';
import Image from 'next/image';

interface OAuthStartResponse {
  oauth_url: string;
  state: string;
  redirect: boolean;
  error?: string;
}

function ConnectStoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#1A1B1E] text-white">
      {/* Header */}
      <header className="h-auto md:h-[101px] border-b border-[#2C2D32]">
        <div className="h-full max-w-[1800px] mx-auto px-4 md:px-12 py-4 md:py-0 flex flex-col md:flex-row justify-between items-center relative">
          <div className="flex w-full md:w-auto justify-between items-center">
            <div className="text-[22px] font-tofino tracking-[-0.05em]">
              <Image
                src="/2 Thinkr logo white letter.png"
                alt="Thinkr Logo"
                width={108}
                height={36}
                priority
                className="object-contain w-24 md:w-auto"
              />
            </div>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto items-center gap-4 md:gap-14 mt-4 md:mt-0`}>
            <Link href="/" className="hover:text-gray-300 py-2 md:py-0">Home</Link>
            <Link href="/app" className="hover:text-gray-300 py-2 md:py-0">App</Link>
            <Link href="/faq" className="hover:text-gray-300 py-2 md:py-0">FAQ</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[917px] mx-auto mt-8 md:mt-[114px] px-4 md:px-0">
        {/* Progress Dots */}
        <div className="flex gap-2 mb-6 md:mb-9 justify-center md:justify-start">
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
        </div>

        <div className="space-y-8">
          <div className="text-center md:text-left space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Connect your store</h1>
            <p className="text-lg md:text-xl text-[#7C5CFC]">Let&apos;s connect your Shopify store to your dashboard</p>
          </div>

          <div className="bg-[#25262b] p-4 md:p-8 rounded-xl border border-[#7C5CFC]/20">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-[#7C5CFC]/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 md:w-8 h-6 md:h-8 text-[#7C5CFC]"
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
                  <h3 className="text-lg md:text-xl font-semibold">Connect Store</h3>
                  <p className="text-gray-400 mt-2 text-sm md:text-base">
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

              <div className="space-y-4 p-3 md:p-4 bg-[#2c2d32] rounded-lg border border-[#7C5CFC]/10">
                <div className="space-y-2">
                  <h4 className="font-medium text-[#7C5CFC] text-sm md:text-base">Before connecting your store:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-[#7C5CFC]/20 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#7C5CFC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-xs md:text-sm text-gray-300">
                        Install our Shopify app{' '}
                        <a 
                          href="https://apps.shopify.com/your-app-name" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#7C5CFC] hover:text-[#7C5CFC]/80 underline"
                        >
                          here
                        </a>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-[#7C5CFC]/20 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#7C5CFC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="text-xs md:text-sm text-gray-300">
                        <p className="mb-1">Ensure you are either:</p>
                        <ul className="ml-4 space-y-1">
                          <li className="list-disc">The store owner</li>
                          <li className="list-disc">An approved staff member with admin access</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-[#7C5CFC]/20 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#7C5CFC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-xs md:text-sm text-gray-300">
                        Verify your email address if you haven&apos;t already
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 pt-2 border-t border-[#7C5CFC]/10">
                  Need help? Check our{' '}
                  <a 
                    href="/help/connecting-store" 
                    className="text-[#7C5CFC] hover:text-[#7C5CFC]/80 underline"
                  >
                    setup guide
                  </a>
                  {' '}or{' '}
                  <a 
                    href="/contact" 
                    className="text-[#7C5CFC] hover:text-[#7C5CFC]/80 underline"
                  >
                    contact support
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:justify-end space-x-4 mb-8 md:mb-0">
            <button
              onClick={() => router.back()}
              className="w-full md:w-auto px-6 py-3 bg-transparent hover:bg-gray-800 rounded font-medium transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingConnectStore() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C5CFC] rounded-full border-t-transparent"></div>
      </div>
    }>
      <ConnectStoreContent />
    </Suspense>
  );
} 