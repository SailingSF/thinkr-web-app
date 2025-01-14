'use client';

import { useEffect, useState } from 'react';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import ScheduleModal from './ScheduleModal';
import HybridLayout from '@/components/HybridLayout';
import { useAuthFetch, useHybridNavigation, isShopifyEmbedded } from '@/utils/shopify';

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

interface Schedule {
  id: number;
  analysis_type: string;
  cron_expression: string;
  is_active: boolean;
  description: string;
  last_run: string | null;
  next_run: string | null;
}

interface SchedulesResponse {
  schedules: Schedule[];
}

export default function Dashboard() {
  const authFetch = useAuthFetch();
  const { navigate } = useHybridNavigation();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Single effect to fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Get user data first
        const userResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`);
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        setUser(userData);

        // Then get connection status
        const statusResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setConnectionStatus(statusData);

          // Fetch schedules if connected
          if (statusData.is_connected) {
            const schedulesResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`);
            if (schedulesResponse.ok) {
              const schedulesData = await schedulesResponse.json() as SchedulesResponse;
              setSchedules(schedulesData.schedules);
            }
          }
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [authFetch, navigate]);

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
      // Include return_to parameter to specify where to redirect after successful connection
      const returnTo = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
      console.log('Starting OAuth flow with return URL:', returnTo);
      
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/oauth/start/?` + new URLSearchParams({
          email: user.email,
          return_to: returnTo
        })
      );

      const data = await response.json();
      console.log('OAuth response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start OAuth process');
      }

      if (data.oauth_url) {
        // Use the OAuth URL directly without modification
        console.log('Redirecting to OAuth URL:', data.oauth_url);
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

  const handleLogout = () => {
    if (!isShopifyEmbedded()) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    navigate('/login');
  };

  const handleScheduleAdd = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`);
      if (response.ok) {
        const data = await response.json() as SchedulesResponse;
        setSchedules(data.schedules);
      }
    } catch (err) {
      console.error('Failed to refresh schedules:', err);
    }
  };

  if (loading) {
    return (
      <HybridLayout>
        <div className="flex items-center justify-center">
          <div className="text-xl text-purple-400">Loading...</div>
        </div>
      </HybridLayout>
    );
  }

  return (
    <HybridLayout onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto space-y-8">
        {error && (
          <div className="mb-8 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {/* User Information */}
        <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user?.first_name || 'User'}!</h2>
          <div className="space-y-2 text-gray-300">
            <p>Email: {user?.email}</p>
            <p>Contact Email: {user?.contact_email}</p>
          </div>
        </div>

        {/* Store Connection Status */}
        <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
          <h2 className="text-2xl font-bold mb-6">Store Connection</h2>
          {connectionStatus ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  connectionStatus.is_connected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-lg">
                  {connectionStatus.is_connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {connectionStatus.is_connected ? (
                <>
                  {connectionStatus.shop_domain && (
                    <p className="text-gray-300">Store: {connectionStatus.shop_domain}</p>
                  )}
                  {connectionStatus.last_sync && (
                    <p className="text-gray-300">
                      Last Synced: {new Date(connectionStatus.last_sync).toLocaleString()}
                    </p>
                  )}
                  <p className="text-gray-300">
                    Subscription: <span className="capitalize">{connectionStatus.subscription_status}</span>
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[#2c2d32] rounded-lg border border-purple-400/10">
                    <h3 className="font-medium text-purple-400 mb-2">Before connecting your store:</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        Install our Shopify app from the Shopify App Store
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        Ensure you are the store owner or have admin access
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        Your email ({user?.email}) should match your Shopify account email
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
          ) : (
            <p className="text-gray-400">Unable to fetch connection status</p>
          )}
        </div>

        {/* Analysis Schedules Section */}
        {connectionStatus?.is_connected && (
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Analysis Schedules</h2>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
              >
                Add Schedule
              </button>
            </div>

            {schedules.length > 0 ? (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-[#2c2d32] rounded-lg border border-purple-400/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-purple-400">
                            {schedule.analysis_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            schedule.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {schedule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {schedule.description || 'No description'}
                        </p>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          {schedule.last_run && (
                            <p>Last run: {new Date(schedule.last_run).toLocaleString()}</p>
                          )}
                          {schedule.next_run && (
                            <p>Next run: {new Date(schedule.next_run).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {schedule.cron_expression}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No analysis schedules yet. Add one to get started!</p>
            )}
          </div>
        )}
      </div>

      <ShopifyErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        error={error}
        userEmail={user?.email}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleAdd={handleScheduleAdd}
      />
    </HybridLayout>
  );
} 