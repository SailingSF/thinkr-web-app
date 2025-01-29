'use client';

import { useEffect, useState } from 'react';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import { useAuthFetch } from '@/utils/shopify';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLocalStorage, User, ConnectionStatus } from '@/hooks/useLocalStorage';

export default function Integrations() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData, isExpired } = useLocalStorage();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(storedData?.user || null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(storedData?.connectionStatus || null);
  const [loading, setLoading] = useState(isExpired);

  useEffect(() => {
    async function fetchInitialData() {
      if (!isExpired && storedData?.user && storedData?.connectionStatus) {
        setUser(storedData.user);
        setConnectionStatus(storedData.connectionStatus);
        setLoading(false);
        return;
      }

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

        // Update local storage
        updateStoredData({
          user: userData,
          connectionStatus: statusData
        });
      } catch (err) {
        console.error('Integrations error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load integration data');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [authFetch, router, isExpired, storedData, updateStoredData]);

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
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-8 lg:py-12 font-inter">
      <div className="container mx-auto px-sm sm:px-md lg:px-lg">
        {/* Title Section */}
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-[35px] text-[#FFFFFF] font-normal m-0">
            Connected integrations
          </h1>
          <p className="text-[25px] text-[#8C74FF] font-normal m-0">
            Manage your connected data sources.
          </p>
        </div>

        {/* Shopify Connection Card */}
        <div className="w-full max-w-[364px] bg-[#242424] rounded-[10px] p-sm sm:p-md">
          <div className="flex flex-col gap-sm sm:gap-md">
            <div className="flex flex-col gap-xs sm:gap-sm">
              <img
                className="w-6 h-[27px] object-contain"
                alt="Shopify"
                src="/shopify_glyph_white.svg"
              />
              <span className="text-sm sm:text-base lg:text-[16.7px] text-[#FFFFFF]">Shopify</span>
            </div>
            <div className="text-xs sm:text-sm text-[#7B7B7B] font-medium relative">
              <div className="flex items-center gap-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-sm lg:text-base text-gray-300">Connected</span>
              </div>
              <p className="m-0 mt-sm sm:mt-md text-sm lg:text-base text-gray-300">Store: {connectionStatus?.shop_domain || 'coffeeelsalvador.myshopify.com'}</p>
              <p className="m-0 mt-xs sm:mt-sm text-sm lg:text-base text-gray-300">Last Synced: {connectionStatus?.last_sync ? new Date(connectionStatus.last_sync).toLocaleString() : '1/24/2024, 6:02:09 PM'}</p>
              <p className="m-0 mt-xs sm:mt-sm text-sm lg:text-base text-gray-300">Subscription: {connectionStatus?.subscription_status || 'Active'}</p>
            </div>
            <div className="text-[#22C55E] text-right text-sm sm:text-base lg:text-[16.7px]">Active</div>
          </div>
        </div>

        {/* Integration Request Section */}
        <h2 className="text-xl sm:text-2xl lg:text-[25px] text-[#FFFFFF] font-normal m-0 mt-xl">
          Let us know which integrations you would like to connect
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg w-full mt-md">
          {/* Meta Ads Card */}
          <div className="w-full max-w-[364px] bg-[#242424] rounded-[10px] p-sm sm:p-md">
            <div className="flex flex-col gap-sm sm:gap-md">
              <div className="flex flex-col gap-xs sm:gap-sm">
                <img
                  src="/meta-icon-2.png"
                  alt="Meta"
                  className="w-6 h-[27px] object-contain"
                />
                <span className="text-sm sm:text-base lg:text-[16.7px] text-[#FFFFFF]">Meta Ads</span>
              </div>
              <div className="text-xs sm:text-sm text-[#7B7B7B] font-medium relative">
                <p className="text-sm text-[#7B7B7B] leading-relaxed">
                  Install our Shopify app from the Shopify App Store. Ensure you are the store owner or have admin access. Your email should match your Shopify account.
                </p>
              </div>
              <div className="text-[#7B7B7B] text-right text-sm sm:text-base lg:text-[16.7px]">Request</div>
            </div>
          </div>

          {/* Google Ads Card */}
          <div className="w-full max-w-[364px] bg-[#242424] rounded-[10px] p-sm sm:p-md">
            <div className="flex flex-col gap-sm sm:gap-md">
              <div className="flex flex-col gap-xs sm:gap-sm">
                <img
                  src="/google-ads-icon-2.png"
                  alt="Google Ads"
                  className="w-6 h-[27px] object-contain"
                />
                <span className="text-sm sm:text-base lg:text-[16.7px] text-[#FFFFFF]">Google Ads</span>
              </div>
              <div className="text-xs sm:text-sm text-[#7B7B7B] font-medium relative">
                <p className="text-sm text-[#7B7B7B] leading-relaxed">
                  Install our Shopify app from the Shopify App Store. Ensure you are the store owner or have admin access. Your email should match your Shopify account.
                </p>
              </div>
              <div className="text-[#7B7B7B] text-right text-sm sm:text-base lg:text-[16.7px]">Request</div>
            </div>
          </div>

          {/* Mailchimp Card */}
          <div className="w-full max-w-[364px] bg-[#242424] rounded-[10px] p-sm sm:p-md">
            <div className="flex flex-col gap-sm sm:gap-md">
              <div className="flex flex-col gap-xs sm:gap-sm">
                <img
                  src="/mailchimp-icon-2.png"
                  alt="Mailchimp"
                  className="w-6 h-[27px] object-contain"
                />
                <span className="text-sm sm:text-base lg:text-[16.7px] text-[#FFFFFF]">Mailchimp</span>
              </div>
              <div className="text-xs sm:text-sm text-[#7B7B7B] font-medium relative">
                <p className="text-sm text-[#7B7B7B] leading-relaxed">
                  Install our Shopify app from the Shopify App Store. Ensure you are the store owner or have admin access. Your email should match your Shopify account.
                </p>
              </div>
              <div className="text-[#7B7B7B] text-right text-sm sm:text-base lg:text-[16.7px]">Request</div>
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