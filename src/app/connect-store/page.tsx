'use client';

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";

interface ConnectionStatus {
  is_connected: boolean;
  shop_domain?: string;
  error?: string;
}

interface AddStoreResponse {
  success?: boolean;
  store?: {
    id: number;
    shop: string;
    shopify_domain: string;
    created_at: string;
  };
  error?: string;
  details?: string;
}

interface UserStore {
  shop_domain: string | null;
  is_connected: boolean;
}

export default function ConnectStore() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [storeDomain, setStoreDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userStore, setUserStore] = useState<UserStore | null>(null);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // If unauthorized, redirect to login
          router.push('/login');
          return;
        }
        throw new Error('Failed to check connection status');
      }

      const data = await response.json() as ConnectionStatus;
      
      setUserStore({
        shop_domain: data.shop_domain || null,
        is_connected: data.is_connected
      });

      if (data.is_connected) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Connection status error:', error);
      if (error instanceof Error && error.message.includes('unauthorized')) {
        router.push('/login');
        return;
      }
      setError(error instanceof Error ? error.message : 'Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // First verify we're still authenticated
      const authCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!authCheck.ok) {
        if (authCheck.status === 401) {
          router.push('/login');
          return;
        }
      }

      // Clean up store domain
      const cleanDomain = storeDomain.trim().toLowerCase();
      // Add myshopify.com if not present
      const fullDomain = cleanDomain.includes('.myshopify.com') 
        ? cleanDomain 
        : `${cleanDomain}.myshopify.com`;

      // Proceed with adding store
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/add-store/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          store_domain: fullDomain
        }),
      });

      const data = await response.json() as AddStoreResponse;

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to add store');
      }

      if (data.success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Add store error:', error);
      setError(error instanceof Error ? error.message : 'Failed to add store');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white flex items-center justify-center">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation />

      {/* Connect Store Content */}
      <main className="container mx-auto px-8 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Connect your Shopify store</h1>
            <p className="text-gray-400 text-lg">
              Connect your store to start receiving AI-powered analytics and recommendations
            </p>
          </div>

          <div className="bg-[#25262b] p-8 rounded-xl border border-purple-400/20">
            <div className="space-y-6">
              {userStore?.shop_domain && (
                <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                  <p className="text-gray-300">Current store: {userStore.shop_domain}</p>
                  <p className="text-sm text-gray-400">
                    Status: {userStore.is_connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              )}
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
                    Enter your Shopify store domain to connect
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddStore} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={storeDomain}
                    onChange={(e) => setStoreDomain(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="w-full p-3 bg-[#2c2d32] rounded-lg border border-gray-700 focus:border-purple-400 focus:outline-none"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Store'}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-400">- OR -</p>
              </div>

              <button
                onClick={() => {
                  const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/shopify/auth`;
                  window.location.href = authUrl;
                }}
                className="w-full py-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors text-lg font-medium"
              >
                Connect via Shopify OAuth
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-400">
            By connecting your store, you agree to our{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
} 