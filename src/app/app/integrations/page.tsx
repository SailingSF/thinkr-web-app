'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, User } from '@/hooks/useLocalStorage';

// Define the structure for a Fivetran connection from our backend
interface FivetranConnection {
  id: number; // Local DB ID
  fivetran_connector_id: string;
  service: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Define the structure for available Fivetran services
interface AvailableService {
  id: string; // e.g., 'google_ads'
  name: string; // e.g., 'Google Ads'
  icon?: string; // Optional: Path to an icon
  description: string;
}

// Hardcoded list based on Django ALLOWED_FIVETRAN_SERVICES
const AVAILABLE_SERVICES: AvailableService[] = [
  { id: 'google_ads', name: 'Google Ads', description: 'Analyze Google Ads performance.', icon: '/google-ads-icon-2.png' },
  { id: 'facebook_ads', name: 'Meta Ads (Facebook/Instagram)', description: 'Analyze Facebook & Instagram Ads performance.', icon: '/meta-icon-2.png' },
  { id: 'google_analytics_4', name: 'Google Analytics', description: 'Connect your GA4 data.', icon: '/google-analytics-icon.png' }, // Assuming icon path
  { id: 'klaviyo', name: 'Klaviyo', description: 'Analyze email marketing performance.', icon: '/klaviyo-white-icon.png' }, // Assuming icon path
  { id: 'gorgias', name: 'Gorgias', description: 'Connect customer support data.', icon: '/gorgias-icon.png' }, // Assuming icon path
  { id: 'pinterest_ads', name: 'Pinterest Ads', description: 'Analyze Pinterest Ads performance.', icon: '/pinterest-icon.png' }, // Assuming icon path
];

function AdvancedIntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authFetch = useAuthFetch();
  const { storedData } = useLocalStorage(); // Keep user data if needed

  const [connections, setConnections] = useState<FivetranConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // For connect/delete actions
  const [error, setError] = useState<string | null>(null);
  const [callbackStatus, setCallbackStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasHandledCallback, setHasHandledCallback] = useState(false); // Flag to prevent double fetch

  // Use refs to track loading state without causing rerenders
  const isFetchingRef = useRef(false);
  const pendingConnectRef = useRef<{ state: string; connection_id: string; is_new: boolean } | null>(null);
  const navigatingToCardRef = useRef(false);
  const PENDING_KEY = 'fivetran_pending_connect';
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Function to log messages
  const debugLog = (message: string, data?: any) => {
    console.log(`[FivetranIntegrations:${new Date().toISOString()}] ${message}`, data || '');
  };

  // Helper to cancel any pending connection
  const cancelPendingConnect = useCallback(async (reason: string = 'unknown') => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(PENDING_KEY) : null;
      if (!raw) return;
      const pending = JSON.parse(raw);
      await authFetch(`${API_BASE_URL}/fivetran/connect-card/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ state: pending.state })
      });
      debugLog('Cancelled pending connection', { reason, ...pending });
    } catch (e) {
      console.warn('[FivetranIntegrations] Cancel request failed (will rely on periodic cleanup)', e);
    } finally {
      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {}
      pendingConnectRef.current = null;
    }
  }, [authFetch, API_BASE_URL]);

  // 1. Fetch Existing Connections - SIMPLIFIED dependencies
  const fetchConnections = useCallback(async () => {
    // Prevent concurrent fetches and infinite loops
    if (isFetchingRef.current) {
       debugLog('Skipping fetchConnections as it is already in progress.');
       return;
    }
    
    debugLog('Fetching existing Fivetran connections...');
    setIsLoadingConnections(true);
    setError(null); // Clear previous errors on new fetch attempt
    isFetchingRef.current = true;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/fivetran/connections/`);
      if (!response.ok) {
        // Try to parse error details from backend
        let errorDetail = `Failed to fetch connections: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (parseError) {
            // Ignore if response is not JSON
        }
        throw new Error(errorDetail);
      }
      const data = await response.json();
      debugLog('Received connections:', data.connectors);
      setConnections(data.connectors || []);
    } catch (err: any) {
       // Check if the error is due to an aborted request (can happen on navigation/cleanup)
       if (err.name === 'AbortError') {
            debugLog('Fetch connections request was aborted, likely due to component unmount or navigation.');
            // Do not update state if aborted to prevent useEffect loops
       } else {
            debugLog('Error fetching connections:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching connections.');
            setConnections([]); // Clear connections on error
       }
    } finally {
      setIsLoadingConnections(false);
      isFetchingRef.current = false;
    }
  }, [authFetch, API_BASE_URL]); // REMOVE circular dependencies

  // On mount: if a pending exists and no callback params, cancel immediately
  useEffect(() => {
    const status = searchParams.get('fivetran_status');
    const hasPending = typeof window !== 'undefined' && !!localStorage.getItem(PENDING_KEY);
    if (hasPending && !status) {
      cancelPendingConnect('mount-no-callback');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cancel on pagehide if user leaves without actually heading to the Connect Card
  useEffect(() => {
    const onPageHide = () => {
      if (navigatingToCardRef.current) return;
      if (typeof window !== 'undefined' && localStorage.getItem(PENDING_KEY)) {
        cancelPendingConnect('pagehide');
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [cancelPendingConnect]);

  // 2. Handle Callback from Fivetran Redirect - ONCE only
  useEffect(() => {
    // This effect runs once on mount to check for callback params
    const handleCallback = () => {
      const status = searchParams.get('fivetran_status');
      if (!status || hasHandledCallback) return;
      
      debugLog('Handling Fivetran callback...');
      setHasHandledCallback(true); // Mark as processed

      const reason = searchParams.get('reason');
      const message = searchParams.get('message');
      const service = searchParams.get('service');
      const connectorId = searchParams.get('connector_id');

      debugLog('Detected Fivetran callback status:', { status, reason, message, service, connectorId });

      if (status === 'success') {
        // Clear any pending connect state on success
        try { localStorage.removeItem(PENDING_KEY); } catch {}
        setCallbackStatus({ 
          type: 'success', 
          message: `Successfully connected ${service || 'service'}${connectorId ? ` (ID: ${connectorId})` : ''}. Refreshing list...` 
        });
        // After setting state, clean URL and fetch connections
        setTimeout(() => {
          // Clean the URL - remove Fivetran query params (this will cause a re-render)
          router.replace(window.location.pathname, { scroll: false });
          // Then fetch connections
          fetchConnections();
        }, 0);
      } else {
        const errorMessage = `Connection failed${service ? ` for ${service}` : ''}. ${reason ? `Reason: ${reason}` : ''} ${message ? `(${message})` : ''}`.trim();
        // Clear any pending connect state on error
        try { localStorage.removeItem(PENDING_KEY); } catch {}
        setCallbackStatus({ type: 'error', message: errorMessage });
        setError(errorMessage); // Also set the main error state
        setIsLoadingConnections(false); // Stop loading indicator on error
        
        // Clean URL
        setTimeout(() => {
          router.replace(window.location.pathname, { scroll: false });
        }, 0);
      }
    };
    
    handleCallback();
    // This effect only needs to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount
  
  // 3. Initial Fetch of Connections on Mount
  useEffect(() => {
    // Only fetch if we don't have callback params that will trigger their own fetch
    const status = searchParams.get('fivetran_status');
    if (!status) {
      debugLog('No callback detected, performing initial fetch.');
      fetchConnections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount

  // 4. Initiate Connection
  const handleInitiateConnection = async (serviceType: string) => {
    debugLog(`Initiating connection for service: ${serviceType}`);
    setIsProcessing(true);
    setError(null);
    setCallbackStatus(null); // Clear previous callback messages

    try {
      const response = await authFetch(`${API_BASE_URL}/fivetran/initiate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceType }),
      });

      const data = await response.json();

      if (!response.ok || !data.connect_card_url) {
         const errorDetail = data.detail || data.error || (data.details ? JSON.stringify(data.details) : `HTTP ${response.status}`);
        throw new Error(errorDetail || 'Failed to initiate Fivetran connection.');
      }

      debugLog(`Received connect card URL: ${data.connect_card_url}`);
      // Persist pending connect details
      const pending = {
        state: data.state,
        connection_id: data.connection_id,
        is_new: data.status === 'new_connection',
        started_at: Date.now(),
      };
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
      pendingConnectRef.current = pending;

      // Mark that we are intentionally navigating to Connect Card (don’t auto-cancel on unload)
      navigatingToCardRef.current = true;

      // Redirect user to Fivetran Connect Card
      window.location.href = data.connect_card_url;
      // Note: State remains Processing until the redirect happens or fails.
      // No need to set IsProcessing(false) here as the page navigates away.

    } catch (err) {
      debugLog('Error initiating connection:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during connection initiation.');
      setIsProcessing(false); // Stop processing on error
    }
  };

  // 5. Delete Connection
  const handleDeleteConnection = async (connectorId: string, serviceName: string) => {
    // Optional: Add a confirmation dialog here
    if (!window.confirm(`Are you sure you want to delete the ${serviceName} connection? This cannot be undone.`)) {
        return;
    }

    debugLog(`Deleting connection: ${connectorId}`);
    setIsProcessing(true);
    setError(null);
    setCallbackStatus(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/fivetran/connections/${connectorId}/`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        debugLog(`Successfully deleted connection: ${connectorId}`);
        setCallbackStatus({ type: 'success', message: `Successfully deleted ${serviceName} connection.` });
        // Refresh the list after successful deletion
        fetchConnections();
      } else if (!response.ok) {
        // Try to parse error details
        let errorDetail = `Failed to delete connection: HTTP ${response.status}`;
         try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData);
         } catch (parseError) {
            // Ignore if response is not JSON
         }
        throw new Error(errorDetail);
      } else {
         // Handle unexpected success statuses if needed, e.g. 200 OK with body
         debugLog(`Delete request returned status ${response.status}, expected 204. Refreshing connections.`);
         fetchConnections(); // Refresh anyway
      }
    } catch (err) {
      debugLog('Error deleting connection:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during deletion.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine which services are already connected
  const connectedServiceIds = new Set(connections.map(c => c.service));
  const availableToConnect = AVAILABLE_SERVICES.filter(s => !connectedServiceIds.has(s.id));

  // --- UI Rendering ---

  // Show loading indicator ONLY if we are actively loading AND haven't processed a callback yet OR if processing an action
  const showLoadingIndicator = isLoadingConnections || isProcessing;


  return (
    <div className="bg-[#141718] pt-0 px-2 sm:px-4 md:px-8 lg:px-10 font-inter overflow-x-hidden">
       {/* Loading Overlay (Optional but good UX) */}
       {showLoadingIndicator && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="text-xl text-purple-400 flex items-center gap-2">
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isProcessing ? 'Processing...' : 'Loading Integrations...'}
                </div>
           </div>
       )}

      <div className="w-full px-0">
        {/* Title Section */}
        <div className="mb-8">
           <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-[35px] text-white font-light mb-2 mt-0">
                    Advanced Integrations
                  </h1>
                </div>
              </div>
          <hr className="border-t border-white mb-8" />
        </div>
        <div className="mb-10" />

        <div className="pb-16">
          {/* Callback Status Messages */}
          {callbackStatus && (
            <div className={`mb-6 p-4 rounded-md ${callbackStatus.type === 'success' ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
              {callbackStatus.message}
            </div>
          )}

          {/* General Error Messages */}
          {error && !callbackStatus /* Don't show general error if a specific callback error/success is shown */ && (
            <div className="mb-6 p-4 rounded-md bg-red-900 text-red-100">
              Error: {error}
            </div>
          )}

          {/* Connected Integrations */}
          <div className="bg-[#141718] rounded-2xl p-6 shadow-lg mb-12">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-light text-white flex items-center gap-2 mb-0">
                Connected Sources
                {connections.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full">
                    {connections.length}
                  </span>
                )}
              </h2>
            </div>
            {connections.length === 0 && !isLoadingConnections && (
              <p className="text-gray-400">No data sources connected yet.</p>
            )}
             {connections.length === 0 && isLoadingConnections && !isProcessing && (
                  <p className="text-gray-400">Loading connected sources...</p> // Show loading text if initial load
             )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map(conn => {
                 const serviceInfo = AVAILABLE_SERVICES.find(s => s.id === conn.service);
                return (
                  <div key={conn.fivetran_connector_id} className="bg-[#242424] rounded-lg p-4 flex flex-col justify-between min-h-[180px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl hover:border-[#8B5CF6] border border-transparent group cursor-pointer">
                     <div>
                      <div className="flex items-center gap-3 mb-2">
                        {serviceInfo?.icon && <img src={serviceInfo.icon} alt={serviceInfo.name} className="w-6 h-6 object-contain"/>}
                        <h3 className="text-lg text-white font-medium">{serviceInfo?.name || conn.service}</h3>
                      </div>
                       {/* Display Status more prominently */}
                       <p className="text-sm text-gray-300 mb-2">Status: <span className={`font-semibold ${conn.status?.toUpperCase() === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`}>{conn.status || 'Unknown'}</span></p>
                       <p className="text-xs text-gray-400">Connector ID: {conn.fivetran_connector_id}</p>
                       <p className="text-xs text-gray-400">Connected: {new Date(conn.created_at).toLocaleString()}</p>
                       <p className="text-xs text-gray-400">Last Updated: {new Date(conn.updated_at).toLocaleString()}</p>
                     </div>
                    <button
                      onClick={() => handleDeleteConnection(conn.fivetran_connector_id, serviceInfo?.name || conn.service)}
                      disabled={isProcessing}
                      className="mt-4 w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isProcessing ? 'Deleting...' : 'Delete Connection'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Integrations */}
          <div className="bg-[#141718] rounded-2xl p-6 shadow-lg">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-light text-white flex items-center gap-2 mb-0">
                Available Sources
                {availableToConnect.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full">
                    {availableToConnect.length}
                  </span>
                )}
              </h2>
            </div>
            {availableToConnect.length === 0 && !isLoadingConnections && connections.length > 0 && (
               <p className="text-gray-400">All available sources are connected.</p>
            )}
             {availableToConnect.length === 0 && isLoadingConnections && !isProcessing && (
                  <p className="text-gray-400">Loading available sources...</p> // Show loading text if initial load
             )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableToConnect.map(service => (
                <div key={service.id} className="bg-[#242424] rounded-lg p-4 flex flex-col justify-between min-h-[180px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl hover:border-[#8B5CF6] border border-transparent group cursor-pointer">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                         {service.icon && <img src={service.icon} alt={service.name} className="w-6 h-6 object-contain"/>}
                         <h3 className="text-lg text-white font-medium">{service.name}</h3>
                      </div>
                    <p className="text-sm text-gray-400 mb-4">{service.description}</p>
                  </div>
                  <button
                    onClick={() => handleInitiateConnection(service.id)}
                    disabled={isProcessing}
                    className="mt-4 w-full px-4 py-2 bg-[#8C74FF] text-white text-sm font-medium rounded hover:bg-[#7B63EE] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? 'Processing...' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Wrap with Suspense because useSearchParams() needs it
export default function AdvancedIntegrations() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#141718]"><div className="text-xl text-purple-400">Loading Page...</div></div>}>
      <AdvancedIntegrationsContent />
    </Suspense>
  );
} 