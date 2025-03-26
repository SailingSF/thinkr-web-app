'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Constants for testing
const PEAKA_PARTNER_API_BASE_URL = 'https://partner.peaka.studio/api/v1';
const TEST_PROJECT_ID = 'acFxu7Xr';

export default function AdvancedIntegrations() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData } = useLocalStorage();
  const [sessionURL, setSessionURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function initializeSession() {
      try {
        // For testing, use hardcoded project ID instead of getting from local storage
        const projectId = TEST_PROJECT_ID;
        
        // Get API key from environment variable
        const apiKey = process.env.NEXT_PUBLIC_PEAKA_PARTNER_API_KEY;
        
        if (!apiKey) {
          throw new Error('Peaka Partner API Key not configured');
        }

        // Prepare headers and payload based on the Python example
        const headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
        
        const payload = {
          'timeoutInSeconds': 300,
          'projectId': projectId,
          'theme': 'dark',
          'themeOverride': false,
          'featureFlags': {
            'createDataInPeaka': true,
            'queries': false
          }
        };

        console.log('Initializing Peaka session with payload:', payload);

        // Call the Peaka partner API directly
        const response = await fetch(
          `${PEAKA_PARTNER_API_BASE_URL}/ui/initSession`,
          {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
          }
        );

        const responseData = await response.json();
        setApiResponse(responseData); // Store complete response for debugging

        if (!response.ok) {
          throw new Error(`Failed to initialize session: ${response.status} ${response.statusText}\nResponse: ${JSON.stringify(responseData)}`);
        }
        
        if (responseData.sessionUrl) {
          console.log('Session URL received:', responseData.sessionUrl);
          setSessionURL(responseData.sessionUrl);
        } else {
          console.error('Invalid response:', responseData);
          throw new Error(`Invalid session response: ${JSON.stringify(responseData)}`);
        }
      } catch (err) {
        console.error('Advanced integrations error:', err);
        setError(err instanceof Error ? err.message : `Failed to initialize advanced integrations: ${JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    }

    initializeSession();
  }, [retryCount]); // Add retryCount to dependencies to allow manual retries

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
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
                <h3 className="text-white mb-2">API Response:</h3>
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
      <div className="container mx-auto px-sm sm:px-md lg:px-lg py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl text-[#FFFFFF] font-normal">Advanced Integrations</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-[#8C74FF] text-white font-medium rounded-lg hover:bg-[#7B63EE] transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#343536] text-white font-medium rounded-lg hover:bg-[#424344] transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
      
      {sessionURL ? (
        <div className="flex-grow w-full h-[calc(100vh-130px)]">
          <iframe
            src={sessionURL}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
            onError={(e) => console.error('iframe error:', e)}
          />
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-xl text-[#FF6B6B]">No session URL available. Please try refreshing.</div>
        </div>
      )}
    </div>
  );
} 