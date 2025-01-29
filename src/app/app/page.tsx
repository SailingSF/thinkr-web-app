'use client';

import { useEffect, useState, useRef } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, User, ConnectionStatus } from '@/hooks/useLocalStorage';

export default function App() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData, isExpired } = useLocalStorage();
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(storedData?.user || null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(storedData?.connectionStatus || null);
  const [loading, setLoading] = useState(!storedData?.user || !storedData?.connectionStatus);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchInitialData() {
      // If we're already fetching or have completed initial load, don't fetch again
      if (fetchingRef.current || initialLoadDoneRef.current) return;
      
      // If we have valid cached data, use it and mark initial load as done
      if (!isExpired && storedData?.user && storedData?.connectionStatus) {
        setUser(storedData.user);
        setConnectionStatus(storedData.connectionStatus);
        setLoading(false);
        initialLoadDoneRef.current = true;
        return;
      }

      fetchingRef.current = true;

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
        
        // Then get connection status
        const statusResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`);
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch connection status');
        }
        const statusData = await statusResponse.json();

        if (mountedRef.current) {
          setUser(userData);
          setConnectionStatus(statusData);
          // Update local storage
          updateStoredData({
            user: userData,
            connectionStatus: statusData
          });
          setError('');
        }
      } catch (err) {
        console.error('App error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load app data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          initialLoadDoneRef.current = true;
        }
        fetchingRef.current = false;
      }
    }

    fetchInitialData();

    return () => {
      mountedRef.current = false;
    };
  }, [authFetch, router, isExpired]); // Removed storedData and updateStoredData from dependencies

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
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-8 lg:py-12 font-inter">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Title Section */}
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-[35px] text-[#FFFFFF] font-normal m-0">
            Action Hub
          </h1>
          <p className="text-[#8C74FF] text-[25px] font-normal m-0">
            Boost your store's performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Connect Store Card */}
          <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-2xl">
            <div className="mb-6 lg:mb-8">
              <p className="text-[#8B5CF6] text-base lg:text-lg mb-2">Step 1:</p>
              <h3 className="text-[32px] font-inter font-normal text-white">Connect your Store</h3>
            </div>

            {connectionStatus?.is_connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-white text-sm lg:text-base">Connected to {connectionStatus.shop_domain}</span>
                </div>
                {connectionStatus.last_sync && (
                  <p className="text-xs lg:text-sm text-gray-400">
                    Last synced: {new Date(connectionStatus.last_sync).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                <div className="p-4 lg:p-6 bg-[#1C1C1E] rounded-xl">
                  <h4 className="font-medium text-[#8B5CF6] mb-3 lg:mb-4">Before connecting:</h4>
                  <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#8B5CF6]">•</span>
                      Install our Shopify app
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#8B5CF6]">•</span>
                      Ensure you have admin access
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#8B5CF6]">•</span>
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
          <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-2xl">
            <div className="mb-6 lg:mb-8">
              <p className="text-[#8B5CF6] text-base lg:text-lg mb-2">Step 2:</p>
              <h3 className="text-[32px] font-inter font-normal text-white">Set up Emails</h3>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <p className="text-sm lg:text-base text-gray-300">
                Configure automated email reports and notifications for your store analytics.
              </p>

              <Link
                href="/app/scheduler"
                className={`inline-block w-full px-4 lg:px-6 py-3 lg:py-4 text-center text-white font-medium rounded-xl transition-colors ${
                  connectionStatus?.is_connected
                    ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Configure Emails
              </Link>

              {!connectionStatus?.is_connected && (
                <p className="text-xs lg:text-sm text-gray-500">
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