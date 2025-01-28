'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import { useAuthFetch } from '@/utils/shopify';

interface ConnectionStatus {
  is_connected: boolean;
  shop_domain: string | null;
  last_sync: string | null;
  subscription_status: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  shopify_user_id: number;
  store: string | null;
}

export default function App() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Get user data first
        const userResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`);
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        setUser(userData);

        // Then get connection status
        const statusResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`);
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch connection status');
        }
        const statusData = await statusResponse.json();
        setConnectionStatus(statusData);
      } catch (err) {
        console.error('App error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load app data');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [authFetch, router]);

  const startOAuthFlow = async () => {
    if (!user?.email) {
      setError('User email not found');
      setIsErrorModalOpen(true);
      return;
    }

    setIsConnecting(true);
    setError('');
    setIsErrorModalOpen(false);

    try {
      const returnTo = `${process.env.NEXT_PUBLIC_APP_URL}/app`;
      
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/oauth/start/?` + new URLSearchParams({
          email: user.email,
          return_to: returnTo
        })
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start OAuth process');
      }

      if (data.oauth_url) {
        window.location.href = data.oauth_url;
      } else {
        throw new Error('Invalid OAuth response from server');
      }
    } catch (error) {
      console.error('OAuth start error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start OAuth process');
      setIsErrorModalOpen(true);
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.first_name || 'User'}!</h1>
          <p className="text-gray-400">Get started at growing your store:</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Connect Store Card */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Step 1:</h2>
              <h3 className="text-xl font-semibold">Connect your Store</h3>
            </div>

            {connectionStatus?.is_connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span>Connected to {connectionStatus.shop_domain}</span>
                </div>
                {connectionStatus.last_sync && (
                  <p className="text-sm text-gray-400">
                    Last synced: {new Date(connectionStatus.last_sync).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#2c2d32] rounded-lg border border-purple-400/10">
                  <h4 className="font-medium text-purple-400 mb-2">Before connecting:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      Install our Shopify app
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      Ensure you have admin access
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      Use email: {user?.email}
                    </li>
                  </ul>
                </div>

                <ShopifyConnectButton
                  onClick={startOAuthFlow}
                  isLoading={isConnecting}
                />
              </div>
            )}
          </div>

          {/* Set up Emails Card */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Step 2:</h2>
              <h3 className="text-xl font-semibold">Set up Emails</h3>
            </div>

            <div className="space-y-4">
              <p className="text-gray-400">
                Configure automated email reports and notifications for your store analytics.
              </p>

              <Link
                href="/app/scheduler"
                className={`inline-block w-full px-6 py-3 text-center ${
                  connectionStatus?.is_connected
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-gray-600 cursor-not-allowed'
                } rounded-md transition-colors`}
              >
                Configure Emails
              </Link>

              {!connectionStatus?.is_connected && (
                <p className="text-sm text-gray-500">
                  Connect your store first to configure email settings
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShopifyErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        error={error}
        userEmail={user?.email}
      />
    </div>
  );
} 