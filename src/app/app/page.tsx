'use client';

import { useEffect, useState, useRef } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, User, ConnectionStatus } from '@/hooks/useLocalStorage';

interface Recommendation {
  id: string;
  subject: string;
  created_at: string;
  store: string;
  has_implementation_steps: boolean;
}

interface RecommendationDetail {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  store: string;
  implementation_emails: {
    subject: string;
    content: string;
    created_at: string;
  }[];
}

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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationDetail | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  useEffect(() => {
    async function fetchRecommendations() {
      if (!user) return;
      
      setLoadingRecommendations(true);
      try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/recommendations/`);
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const data = await response.json();
        // The API returns an array directly
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    }

    fetchRecommendations();
  }, [user, authFetch]);

  const fetchRecommendationDetail = async (id: string) => {
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recommendations/${id}/`
      );
      if (!response.ok) throw new Error('Failed to fetch recommendation detail');
      const data = await response.json();
      setSelectedRecommendation(data);
    } catch (error) {
      console.error('Failed to fetch recommendation detail:', error);
      // Clear the selected recommendation on error
      setSelectedRecommendation(null);
    }
  };

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
        <div className="mb-12">
          <h1 className="text-[35px] text-[#8B5CF6] font-normal m-0">
            Action Hub
          </h1>
          <p className="text-white text-[25px] font-normal m-0 mb-10">
            Boost your store's performance.
          </p>
          <hr className="border-t border-white mb-10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Connect Store Card */}
          <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-2xl">
            <div className="mb-6 lg:mb-8">
              <p className="text-[#8B5CF6] text-base lg:text-lg mb-2">Step 1:</p>
              <h3 className="text-[32px] font-inter font-normal text-white">Connect to your Shopify Store</h3>
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
                <ShopifyConnectButton
                  onClick={startOAuthFlow}
                  isLoading={isConnecting}
                />
                <p className="text-xs lg:text-sm text-gray-400 text-left">
                  thinkr will connect automatically if you already installed the app.
                </p>
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

        {/* Recommendations Section */}
        <div className="mt-10 lg:mt-12">
          <div className="mb-4">
            <h2 className="text-[32px] text-white font-normal">Task Management</h2>
            <p className="text-white text-lg">View and manage your store tasks</p>
          </div>

          {loadingRecommendations ? (
            <div className="bg-[#141718] p-4 rounded-2xl">
              <div className="flex justify-center items-center h-24">
                <div className="text-gray-400 flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#8B5CF6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading tasks...
                </div>
              </div>
            </div>
          ) : !recommendations || recommendations.length === 0 ? (
            <div className="bg-[#141718] p-4 rounded-2xl">
              <div className="text-center py-6">
                <p className="text-gray-400 mb-1">No tasks available yet.</p>
                <p className="text-sm text-gray-500">Check back later for personalized tasks for your store.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedRecommendation ? (
                <div className="bg-[#141718] p-4 lg:p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-2xl text-white mb-1">{selectedRecommendation.subject}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(selectedRecommendation.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRecommendation(null)}
                      className="text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back to list
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl">
                      <div className="prose prose-lg prose-light max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedRecommendation.content }}
                      />
                    </div>
                    {selectedRecommendation.implementation_emails.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xl text-white mb-3 flex items-center gap-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Implementation Steps
                        </h4>
                        <div className="space-y-3">
                          {selectedRecommendation.implementation_emails.map((email, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl">
                              <h5 className="text-[#8B5CF6] text-lg mb-3 font-medium">{email.subject}</h5>
                              <div className="prose prose-lg prose-light max-w-none"
                                dangerouslySetInnerHTML={{ __html: email.content }}
                              />
                              <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M8 4V8L10.5 10.5M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Created on {new Date(email.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#141718] p-4 rounded-2xl overflow-x-auto scrollbar-hide">
                  <table className="min-w-full">
                    <thead className="border-b border-white">
                      <tr>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider"></th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Task</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Owner</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Status</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Timeline</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Initiated</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Risk Level</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Systems</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Time Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recommendations.map((rec) => {
                        // Get the date objects for created_at and the day after
                        const createdDate = new Date(rec.created_at);
                        const nextDay = new Date(createdDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        
                        // Format the dates
                        const initiatedDate = createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                        const dayAfter = nextDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                        
                        return (
                          <tr 
                            key={rec.id} 
                            className="hover:bg-[#3C3C3E] cursor-pointer transition-colors"
                            onClick={() => fetchRecommendationDetail(rec.id)}
                          >
                            <td className="px-3 py-3 whitespace-nowrap">
                              <button className="text-gray-400">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-white">{rec.subject}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="group relative">
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="currentColor"/>
                                    <path d="M8 9C5.79086 9 4 10.7909 4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13C12 10.7909 10.2091 9 8 9Z" fill="currentColor"/>
                                  </svg>
                                </div>
                                <div className="absolute left-0 mt-2 w-auto px-3 py-1 rounded shadow-lg bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                  {user?.first_name || "Store Owner"}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {rec.has_implementation_steps ? (
                                <span className="w-32 text-center px-3 py-1 inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-lg bg-[#10AA56] text-white">
                                  See Implementation
                                </span>
                              ) : (
                                <span className="w-32 text-center px-3 py-1 inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-lg bg-[#FDAB3D] text-white">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">{dayAfter}</td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">{initiatedDate}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-700 text-white">
                                Low
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">Shopify</td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">2 hrs</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
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