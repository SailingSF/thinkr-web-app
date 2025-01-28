'use client';

import { useEffect, useState } from 'react';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import { useAuthFetch } from '@/utils/shopify';
import { useRouter } from 'next/navigation';

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

export default function Integrations() {
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
        console.error('Integrations error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load integration data');
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
      const returnTo = `${process.env.NEXT_PUBLIC_APP_URL}/app/integrations`;
      
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
          <h1 className="text-3xl font-bold mb-2">Connected integrations</h1>
          <p className="text-gray-400">Manage your connected data sources.</p>
        </div>

        {/* Shopify Connection Card */}
        <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8">
              <svg viewBox="0 0 256 256" className="w-full h-full">
                <path fill="#95BF47" d="M223.774 70.43c-.164-.946-1.018-1.474-1.728-1.637c-.71-.164-14.957-1.146-14.957-1.146s-9.93-9.93-11.003-10.967c-1.073-1.037-3.165-1.71-5.129-1.71h-.164c-.473-.491-1.146-1.037-2.037-1.583c-2.983-1.728-6.893-2.401-10.913-2.401c-.491 0-1.037 0-1.528.055c-1.146-.491-2.401-.946-3.711-1.346c-8.839-2.51-16.849.491-21.824 6.42c-3.165 3.711-5.566 8.894-6.22 12.714c-6.329.946-10.749 1.819-10.913 1.819c-3.22.946-3.329 1.037-3.711 3.875C129.7 77.76 128 137.927 128 137.927l75.912 14.084l41.193-10.094S223.938 71.376 223.774 70.43zM164.485 54.108c-2.146.564-4.566 1.255-7.166 1.946v-1.219c0-4.075-.564-7.384-1.637-10.094c4.02.491 6.675 2.801 8.803 9.367zM151.661 56.727c-4.893 1.346-10.203 2.801-15.641 4.293c1.528-5.893 4.402-11.731 9.857-11.731c2.219 0 3.984.782 5.457 2.146c1.146 1.146 1.946 2.801 2.219 4.784c0 .182.055.328.055.509v-.001zm-9.857-19.333c1.401 0 2.674.182 3.875.564c-9.694 4.511-14.084 15.914-16.303 25.553c-4.293 1.146-8.53 2.328-12.441 3.402c2.51-12.277 14.084-29.519 24.869-29.519z"/>
                <path fill="#5E8E3E" d="M222.046 68.793c-.71-.164-14.957-1.146-14.957-1.146s-9.93-9.93-11.003-10.967c-.418-.382-1.037-.709-1.71-.946l-7.857 157.267l41.193-10.094s-3.875-132.398-4.02-133.344c-.218-.946-1.073-1.474-1.646-1.637v-.133z"/>
                <path fill="#FFF" d="M148.551 92.254l-5.784 17.242s-5.075-2.674-11.185-2.674c-9.039 0-9.512 5.675-9.512 7.112c0 7.748 20.26 10.749 20.26 29.028c0 14.375-9.148 23.606-21.388 23.606c-14.739 0-22.279-9.148-22.279-9.148l3.947-13.076s7.748 6.675 14.266 6.675c4.293 0 6.057-3.329 6.057-5.784c0-10.094-16.576-10.531-16.576-27.19c0-13.984 10.021-27.517 30.281-27.517c7.821-.055 11.913 1.728 11.913 1.728v.018z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Shopify</h2>
              <p className="text-gray-400 text-sm">Install our Shopify app from the Shopify App Store.</p>
              <p className="text-gray-400 text-sm">Ensure you are the store owner or have admin access.</p>
              <p className="text-gray-400 text-sm">Your email (user.email) should match your Shopify account email.</p>
            </div>
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
            <ShopifyConnectButton
              onClick={startOAuthFlow}
              isLoading={isConnecting}
            />
          )}
        </div>

        {/* Integration Request Cards */}
        <h2 className="text-xl font-semibold mb-4">Let us know which integrations you would like to connect</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Meta Ads Card */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 8H17M7 12H17M7 16H17" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Meta Ads</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Integration with Meta Ads lets thinkr optimize ad spend and automate campaign adjustments based on AI-driven insights.</p>
            <button className="w-full px-4 py-2 bg-[#2c2d32] text-gray-300 rounded-lg hover:bg-[#35363c] transition-colors">
              Request
            </button>
          </div>

          {/* Google Ads Card */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                  <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" fill="#4285F4"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Google Ads</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Integration with Google Ads lets Thinkr optimize ad spend and automate campaign adjustments based on AI-driven insights.</p>
            <button className="w-full px-4 py-2 bg-[#2c2d32] text-gray-300 rounded-lg hover:bg-[#35363c] transition-colors">
              Request
            </button>
          </div>

          {/* Mailchimp Card */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                  <path d="M22 5.92C22 4.86 21.14 4 20.08 4H3.92C2.86 4 2 4.86 2 5.92v12.16C2 19.14 2.86 20 3.92 20h16.16c1.06 0 1.92-.86 1.92-1.92V5.92z" fill="#FFE01B"/>
                  <path d="M12 15.07l-6.5-3.75v7.68h13v-7.68L12 15.07z" fill="#000"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold">MailChimp</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Integration with Mailchimp lets thinkr automate email campaigns and optimize send times based on customer behavior data.</p>
            <button className="w-full px-4 py-2 bg-[#2c2d32] text-gray-300 rounded-lg hover:bg-[#35363c] transition-colors">
              Request
            </button>
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