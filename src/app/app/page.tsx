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
  has_implementation_steps: boolean;
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
  const [expandedRecommendationId, setExpandedRecommendationId] = useState<string | null>(null);

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
      // If we're closing the current item, don't fetch again
      if (expandedRecommendationId === id && selectedRecommendation?.id === id) {
        setExpandedRecommendationId(null);
        return;
      }
      
      // If switching to a new item, set the expanded ID first
      setExpandedRecommendationId(id);
      
      // If we already have the data, don't fetch again
      if (selectedRecommendation?.id === id) return;
      
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recommendations/${id}/`
      );
      if (!response.ok) throw new Error('Failed to fetch recommendation detail');
      const data = await response.json();
      setSelectedRecommendation(data);
    } catch (error) {
      console.error('Failed to fetch recommendation detail:', error);
      // Clear the expanded state and selected recommendation on error
      setExpandedRecommendationId(null);
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
      <div className="h-full overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Title Section */}
          <div className="mb-12">
            <h1 className="text-[35px] text-[#8B5CF6] font-normal mb-2">
              Action Hub
            </h1>
            <p className="text-[22px] text-white font-normal mb-8">
              Boost your store's performance.
            </p>
            <hr className="border-t border-white mb-10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Connect Store Card */}
            <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-lg">
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
            <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-lg">
              <div className="mb-6 lg:mb-8">
                <p className="text-[#8B5CF6] text-base lg:text-lg mb-2">Step 2:</p>
                <h3 className="text-[32px] font-inter font-normal text-white">Set up Emails</h3>
              </div>

              <div className="space-y-4 lg:space-y-6">
                <Link
                  href="/app/scheduler"
                  className={`inline-block w-full px-4 lg:px-6 py-3 lg:py-4 text-center text-white font-medium rounded-md transition-colors ${
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
            <div className="mb-0">
              <h2 className="text-[25px] text-white font-normal mb-2">Task Management</h2>
            </div>

            {loadingRecommendations ? (
              <div className="bg-[#141718] p-4 rounded-lg">
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
              <div className="bg-[#141718] p-4 rounded-lg">
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-1">No tasks available yet.</p>
                  <p className="text-sm text-gray-500">Check back later for personalized tasks for your store.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#141718] p-4 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
                  <table className="min-w-full">
                    <thead className="border-b border-white">
                      <tr>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider"></th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-white tracking-wider">Task</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Owner</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Status</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Timeline</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Initiated</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Risk Level</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Systems</th>
                        <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-white tracking-wider">Time Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {recommendations.map((rec) => {
                        // Get the date objects for created_at and the day after
                        const createdDate = new Date(rec.created_at);
                        const nextDay = new Date(createdDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        
                        // Format the dates
                        const initiatedDate = createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                        const dayAfter = nextDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                        
                        const isExpanded = expandedRecommendationId === rec.id;
                        const isLoading = isExpanded && (!selectedRecommendation || selectedRecommendation.id !== rec.id);
                        
                        return (
                          <>
                            <tr 
                              key={`row-${rec.id}`} 
                              className={`hover:bg-[#3C3C3E] cursor-pointer transition-colors ${isExpanded ? 'bg-[#3C3C3E]' : ''}`}
                              onClick={() => fetchRecommendationDetail(rec.id)}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">
                                <button className="text-gray-400">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {isExpanded ? (
                                      <path d="M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    ) : (
                                      <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    )}
                                  </svg>
                                </button>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-white">{rec.subject}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="group relative flex justify-center">
                                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="currentColor"/>
                                      <path d="M8 9C5.79086 9 4 10.7909 4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13C12 10.7909 10.2091 9 8 9Z" fill="currentColor"/>
                                    </svg>
                                  </div>
                                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-auto px-3 py-1 rounded-sm shadow-lg bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                    {user?.first_name || "Store Owner"}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                {rec.has_implementation_steps ? (
                                  <span className="w-32 text-center px-3 py-1 inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-sm bg-[#10AA56] text-white">
                                    Implementation
                                  </span>
                                ) : (
                                  <span className="w-32 text-center px-3 py-1 inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-sm bg-[#FDAB3D] text-white">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300 text-center">{dayAfter}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300 text-center">{initiatedDate}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex justify-center">
                                  <span className="w-16 text-center px-3 py-1 inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-sm bg-blue-700 text-white">
                                    Low
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300 text-center">Shopify</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300 text-center">2 hrs</td>
                            </tr>
                            
                            {/* Expanded Content */}
                            {isExpanded && (
                              <tr key={`details-${rec.id}`}>
                                <td colSpan={9} className="bg-[#3C3C3E] px-4 py-4">
                                  <div className="animate-fadeIn">
                                    {isLoading ? (
                                      <div className="flex justify-center items-center py-8">
                                        <div className="text-gray-400 flex items-center gap-2">
                                          <svg className="animate-spin h-5 w-5 text-[#8B5CF6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Loading details...
                                        </div>
                                      </div>
                                    ) : selectedRecommendation && (
                                      <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-md">
                                          <div className="prose prose-lg prose-light max-w-none"
                                            dangerouslySetInnerHTML={{ __html: selectedRecommendation.content }}
                                          />
                                        </div>
                                        
                                        {/* Implementation Steps Section */}
                                        {selectedRecommendation.has_implementation_steps && (
                                          <div className="mt-4 bg-[#2C2C2E] p-4 rounded-md border border-[#8B5CF6]">
                                            <h4 className="text-xl text-white mb-4 flex items-center gap-2">
                                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                              Implementation Steps
                                            </h4>
                                            
                                            <div className="space-y-4">
                                              <div className="bg-white p-4 rounded-md">
                                                <ul className="list-none space-y-3">
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        1
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 1: Analyze Product Sales Data</p>
                                                      <p className="text-sm text-gray-600">Approximately 1 week for analysis and theme identification.</p>
                                                    </div>
                                                  </li>
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        2
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 2: Define Bundling Strategy</p>
                                                      <p className="text-sm text-gray-600">2 days to finalize bundling strategy and pricing.</p>
                                                    </div>
                                                  </li>
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        3
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 3: Update E-commerce Platform</p>
                                                      <p className="text-sm text-gray-600">3 days for setup of bundles and platform updates.</p>
                                                    </div>
                                                  </li>
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        4
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 4: Implement Pricing Adjustments</p>
                                                      <p className="text-sm text-gray-600">1 day to ensure correct pricing and discounts are applied.</p>
                                                    </div>
                                                  </li>
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        5
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 5: Design Visual Highlights</p>
                                                      <p className="text-sm text-gray-600">4 days for design and placement of promotional materials.</p>
                                                    </div>
                                                  </li>
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        6
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 6: Update Checkout Process</p>
                                                      <p className="text-sm text-gray-600">2 days for checkout customization.</p>
                                                    </div>
                                                  </li>
                                                  <li className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                                                        7
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-800 font-medium">Step 7: Launch and Monitor Performance</p>
                                                      <p className="text-sm text-gray-600">1 day for testing and initial launch, ongoing monitoring over the following weeks.</p>
                                                    </div>
                                                  </li>
                                                </ul>
                                                
                                                <div className="mt-5 pt-4 border-t border-gray-200">
                                                  <p className="text-gray-700 flex items-center">
                                                    <span className="font-semibold mr-2">Total Time Estimate:</span> 
                                                    <span>Approximately 3 weeks for initial implementation and testing.</span>
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Related Emails Section */}
                                        {selectedRecommendation.implementation_emails.length > 0 && (
                                          <div className="mt-4">
                                            <h4 className="text-xl text-white mb-3 flex items-center gap-2">
                                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                              Related Communications
                                            </h4>
                                            <div className="space-y-3">
                                              {selectedRecommendation.implementation_emails.map((email, index) => (
                                                <div key={index} className="bg-white p-4 rounded-md">
                                                  <h5 className="text-[#8B5CF6] text-lg mb-3 font-medium">{email.subject}</h5>
                                                  <div className="prose prose-lg prose-light max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: email.content }}
                                                  />
                                                  <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                      <path d="M8 4V8L10.5 10.5M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    Sent on {new Date(email.created_at).toLocaleDateString()}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ShopifyErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        error={error}
        userEmail={user?.email}
      />
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 2000px; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 