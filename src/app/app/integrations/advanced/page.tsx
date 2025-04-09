'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, User } from '@/hooks/useLocalStorage';

// Removed Peaka constants
// const PEAKA_PARTNER_API_BASE_URL = 'https://partner.peaka.studio/api/v1';
// const TEST_PROJECT_ID = 'acFxu7Xr';

export default function AdvancedIntegrations() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData } = useLocalStorage();
  const [sessionURL, setSessionURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs to prevent duplicate initialization
  const initializationInProgress = useRef(false);
  const isInitialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to log session events to assist with debugging
  const debugLog = (message: string, data?: any) => {
    console.log(`[AdvancedIntegrations:${new Date().toISOString()}] ${message}`, data || '');
  };

  // Direct state to store project ID to avoid relying solely on local storage
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup function to abort any in-flight requests when component unmounts
    return () => {
      debugLog('Component unmounting, aborting any in-flight requests');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    async function getProjectId(apiUrlBase: string): Promise<string | null> {
      // Check if we already have a project ID in local storage
      const existingProjectId = storedData?.user?.peaka_project_id || projectId;
      if (existingProjectId) {
        debugLog(`Found existing project ID in local storage or state: ${existingProjectId}`);
        // Ensure the project ID is set in component state
        setProjectId(existingProjectId);
        return existingProjectId;
      }

      debugLog('No project ID in local storage or state, fetching user data...');
      try {
        abortControllerRef.current = new AbortController();
        const userResponse = await authFetch(`${apiUrlBase}/user/`, {
          signal: abortControllerRef.current.signal
        });

        if (!userResponse.ok) {
          const errorMessage = `Failed to fetch user data: ${userResponse.statusText}`;
          debugLog('ERROR: User data fetch failed', errorMessage);
          
          // Set error state
          setError(errorMessage);
          
          // Explicitly trigger loading and initialization flags to stop retrying
          setLoading(false);
          initializationInProgress.current = false;
          
          // Return null instead of throwing
          return null;
        }

        const userData: User = await userResponse.json();
        debugLog('Received user data', userData);
        
        // Check for project ID
        const userProjectId = userData.peaka_project_id;
        
        // Update local storage with user data
        updateStoredData({ user: userData });
        debugLog('Local storage updated with user data. Project ID from user data:', userProjectId);

        if (userProjectId) {
          debugLog(`Found project ID from user data: ${userProjectId}`);
          setProjectId(userProjectId);
          return userProjectId;
        }

        // No project ID in user data, need to create one
        debugLog('No project ID in user data, creating project...');
        
        abortControllerRef.current = new AbortController();
        const createResponse = await authFetch(
          `${apiUrlBase}/peaka/project/create/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}), // Empty body, as backend now auto-generates project names
            signal: abortControllerRef.current.signal
          }
        );

        const createData = await createResponse.json();
        debugLog('Create project response', createData);

        if (!createResponse.ok || !createData.success) {
          // Capture the error message from the response
          const errorMessage = createData.message || `Failed to create project: ${createResponse.statusText}`;
          debugLog('ERROR: Project creation failed', errorMessage);
          
          // Set the API response for debugging display
          setApiResponse(createData);
          
          // Set error state - this will be displayed to the user
          setError(errorMessage);
          
          // Explicitly trigger loading and initialization flags to stop retrying
          setLoading(false);
          initializationInProgress.current = false;
          
          // Return null instead of throwing to prevent automatic retries
          return null;
        }

        // Use the project_id directly from the create response
        const newProjectId = createData.project_id;
        if (!newProjectId) {
          debugLog('ERROR: Project created but no project_id in response', createData);
          throw new Error('Project created but no project_id in response');
        }
        
        debugLog(`Successfully created project with ID: ${newProjectId}`);
        
        // Update component state
        setProjectId(newProjectId);
        
        // Update local storage with the new project ID
        // First get current user data and update it
        if (storedData?.user) {
          const updatedUser = {
            ...storedData.user,
            peaka_project_id: newProjectId // Only set peaka_project_id
          };
          
          updateStoredData({ user: updatedUser });
          debugLog('Updated local storage with new project ID', updatedUser);
        }
        
        // Return the project ID directly from create response
        return newProjectId;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          debugLog('Request was aborted');
          return null;
        }
        debugLog('Error in getProjectId', err);
        throw err;
      }
    }

    async function initializeSession() {
      // Prevent duplicate initialization calls
      if (initializationInProgress.current) {
        debugLog('Initialization already in progress, skipping');
        return;
      }

      // Skip if already initialized successfully
      if (isInitialized.current && sessionURL) {
        debugLog('Already initialized with session URL, skipping');
        return;
      }

      // Set initialization flag
      initializationInProgress.current = true;
      
      debugLog('Starting initialization');
      setLoading(true);
      setError(null);
      setApiResponse(null);

      try {
        const apiUrlBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrlBase) {
          throw new Error('API URL is not configured');
        }

        // STAGE 1: Get the project ID if we don't already have it in state
        let currentProjectId = projectId;
        if (!currentProjectId) {
          debugLog('No project ID in component state, attempting to retrieve one...');
          currentProjectId = await getProjectId(apiUrlBase);
          
          if (!currentProjectId) {
            debugLog('ERROR: Could not determine project ID after all attempts');
            throw new Error('Could not determine project ID');
          }
          
          debugLog(`Successfully obtained project ID: ${currentProjectId}`);
        } else {
          debugLog(`Using existing project ID from state: ${currentProjectId}`);
        }

        // STAGE 2: Initialize the session with the obtained project ID
        debugLog(`Proceeding to session initialization with project ID: ${currentProjectId}`);
        
        abortControllerRef.current = new AbortController();
        const sessionResponse = await authFetch(
          `${apiUrlBase}/peaka/session/initialize/`,
          {
            method: 'POST',
            signal: abortControllerRef.current.signal
          }
        );

        const sessionData = await sessionResponse.json();
        debugLog('Session initialization response', sessionData);
        setApiResponse(sessionData);

        if (!sessionResponse.ok || !sessionData.success) {
          const errorMessage = sessionData.message || `Failed to initialize session: ${sessionResponse.statusText}`;
          debugLog('ERROR: Session initialization failed', errorMessage);
          
          // Set error state to show to user
          setError(errorMessage);
          
          // Explicitly set flags to prevent retries
          isInitialized.current = false;
          
          // Return without throwing to prevent automatic retries
          return;
        }

        if (sessionData.sessionUrl) {
          debugLog(`Session URL received: ${sessionData.sessionUrl}`);
          setSessionURL(sessionData.sessionUrl);
          isInitialized.current = true;
        } else {
          throw new Error('Session response missing sessionUrl');
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          debugLog('Request was aborted');
          return;
        }
        
        debugLog('Error in initializeSession', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        initializationInProgress.current = false;
      }
    }

    // Only try to initialize if we have storedData and haven't already successfully initialized
    const shouldInitialize = 
      storedData !== null && 
      !initializationInProgress.current && 
      (!isInitialized.current || !sessionURL) &&
      !error; // Don't try to initialize if there's already an error

    if (shouldInitialize) {
      debugLog('Conditions met for initialization');
      // Wrap in setTimeout to avoid potential race conditions during React rendering
      setTimeout(() => {
        initializeSession();
      }, 0);
    }
  }, [authFetch, storedData, updateStoredData, retryCount, sessionURL, projectId, error]);

  const handleRetry = () => {
    debugLog('Manual retry requested');
    // Reset initialization flags
    isInitialized.current = false;
    initializationInProgress.current = false;
    
    // Abort any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Trigger a retry
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-xl text-purple-400">Loading Advanced Integrations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-8 lg:py-12 font-inter">
        <div className="container mx-auto px-sm sm:px-md lg:px-lg h-full flex items-center justify-center">
          <div className="flex flex-col gap-4 items-center justify-center">
            <h1 className="text-2xl text-[#FFFFFF] font-normal">Advanced Integrations Error</h1>
            <p className="text-lg text-[#FF6B6B] max-w-2xl text-center">{error}</p>
            
            {apiResponse && (
              <div className="mt-4 p-4 bg-[#1E1E1E] rounded-lg max-w-2xl w-full">
                <h3 className="text-white mb-2">Debug Info (Last API Response):</h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-[#8C74FF] text-white font-medium rounded-lg shadow-lg hover:bg-[#7B63EE] transition-colors"
              >
                Retry Connection
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-[#343536] text-white font-medium rounded-lg shadow-lg hover:bg-[#424344] transition-colors"
              >
                Back to Integrations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] flex flex-col">
      <div className="h-full overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
        <div className="py-4 lg:py-6">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-[35px] text-[#8B5CF6] font-normal mb-2">
                    Advanced Integrations
                  </h1>
                  <p className="text-[22px] text-white font-normal">
                    Configure and manage advanced data integrations.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-[#8B5CF6] text-white font-medium rounded-lg hover:bg-[#7B63EE] transition-colors disabled:opacity-50"
                    disabled={initializationInProgress.current}
                  >
                    {initializationInProgress.current ? 'Loading...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-[#343536] text-white font-medium rounded-lg hover:bg-[#424344] transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
              <hr className="border-t border-white mb-8" />
            </div>

            {/* Main Content */}
            {sessionURL ? (
              <div className="flex-grow w-full h-[calc(100vh-130px)]">
                <iframe
                  src={sessionURL}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
                  onError={(e) => {
                    console.error('iframe error:', e);
                    setError('Failed to load the embedded integration window. Please try refreshing.');
                    setSessionURL(null);
                    isInitialized.current = false;
                  }}
                />
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <div className="text-xl text-[#FF6B6B]">
                  {initializationInProgress.current 
                    ? 'Setting up your advanced integrations...' 
                    : 'No session URL available. Please try refreshing.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 