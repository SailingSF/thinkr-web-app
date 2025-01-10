'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import ScheduleModal from './ScheduleModal';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';

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

interface AnalysisSchedule {
  id: number;
  analysis_type: string;
  cron_expression: string;
  is_active: boolean;
  description: string;
  last_run: string | null;
  next_run: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schedules, setSchedules] = useState<AnalysisSchedule[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Get connection status
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch connection status');
        }

        const data = await response.json();
        setConnectionStatus(data);
        
        // Try to get user data from localStorage first
        const userData = localStorage.getItem('user_data');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          // Fallback: fetch user data from API if not in localStorage
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Token ${token}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
            // Store for future use
            localStorage.setItem('user_data', JSON.stringify(userData));
          }
        }

        // Get analysis schedules
        const schedulesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (schedulesResponse.ok) {
          const schedulesData = await schedulesResponse.json();
          setSchedules(schedulesData.schedules);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const startOAuthFlow = async () => {
    setIsConnecting(true);
    setError('');
    setIsErrorModalOpen(false);
    console.log('Starting OAuth flow...');

    try {
      const token = getAuthToken();
      if (!token) {
        console.log('No auth token found, redirecting to login');
        router.push('/login');
        return;
      }

      // Include return_to parameter to specify where to redirect after successful connection
      const returnTo = `${window.location.origin}/dashboard`;
      console.log('Making OAuth start request...');
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

      const data = await response.json();
      console.log('OAuth response:', data);

      if (!response.ok) {
        console.log('OAuth response not ok:', response.status, data);
        // Construct error message using both error and details if available
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to start OAuth process');
        throw new Error(errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to start OAuth process';
      console.log('Setting error:', errorMessage);
      console.log('Opening error modal...');
      setError(errorMessage);
      setIsErrorModalOpen(true);
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.push('/login');
  };

  const handleScheduleAdd = async () => {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setSchedules(data.schedules);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white flex items-center justify-center">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation onLogout={handleLogout} />

      {/* Dashboard Content */}
      <main className="container mx-auto px-8 py-12">
        {error && (
          <div className="mb-8 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-8">
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

          {/* Analytics Schedule */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Analytics Schedule</h2>
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
                  <div key={schedule.id} className="p-4 bg-[#2c2d32] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{schedule.analysis_type}</h3>
                        <p className="text-gray-400 text-sm">{schedule.description}</p>
                        <p className="text-gray-400 text-sm mt-2">Schedule: {schedule.cron_expression}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${schedule.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </div>
                        {schedule.next_run && (
                          <p className="text-gray-400 text-sm mt-1">
                            Next run: {new Date(schedule.next_run).toLocaleString()}
                          </p>
                        )}
                        {schedule.last_run && (
                          <p className="text-gray-400 text-sm mt-1">
                            Last run: {new Date(schedule.last_run).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No analytics schedules configured</p>
            )}
          </div>
        </div>
      </main>

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleAdd={handleScheduleAdd}
      />

      <ShopifyErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        error={error}
        userEmail={user?.email}
      />
    </div>
  );
} 