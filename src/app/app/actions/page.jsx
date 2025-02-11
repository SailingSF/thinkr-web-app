'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const POLLING_INTERVAL = 2000; // Poll every 2 seconds

export default function ActionsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const executionAttempted = useRef(false);
  const responseData = useRef(null);

  useEffect(() => {
    console.log('Effect started, current status:', status);
    let mounted = true;
    let timeoutId = null;

    const handleResponse = (data) => {
      if (data.status?.toLowerCase() === 'completed') {
        console.log('Setting completed state from data:', data);
        setStatus('completed');
        if (data.error) {
          setError(data.error);
        }
        if (data.result?.message) {
          setResult(data.result);
          setMessage(data.result.message);
        } else if (data.result) {
          setResult(data.result);
        }
        return true;
      }
      return false;
    };

    const executeAction = async () => {
      const actionParam = searchParams.get('action');
      console.log('Executing action with param:', actionParam);
      
      if (!actionParam) {
        console.log('No action parameter found');
        setError('Missing action parameter');
        setStatus('error');
        return;
      }

      // If we have cached response data, use it
      if (responseData.current) {
        console.log('Using cached response data');
        handleResponse(responseData.current);
        return;
      }

      if (executionAttempted.current) {
        console.log('Action already attempted, skipping');
        return;
      }
      executionAttempted.current = true;

      try {
        console.log('Making API call to execute-shop-action');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/execute-shop-action/?action=${actionParam}`
        );
        const data = await response.json();
        console.log('API response:', data);

        // Cache the response data
        responseData.current = data;

        if (!mounted) {
          console.log('Component unmounted, but caching response for next mount');
          return;
        }

        // Handle the response
        if (!handleResponse(data)) {
          // Only proceed with polling if we didn't handle it as completed
          if (data.status === 'processing' && data.action_id && data.task_id) {
            console.log('Received processing status, starting polling');
            setStatus('loading');
            startPolling(data.action_id, data.task_id);
          } else {
            console.log('Unexpected response, setting error');
            setStatus('error');
            setError(data.error || 'Unexpected response from server');
          }
        }
      } catch (err) {
        console.error('Error executing action:', err);
        if (!mounted) return;
        setStatus('error');
        setError('Failed to execute action');
      }
    };

    executeAction();

    return () => {
      console.log('Effect cleanup, setting mounted to false');
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams]);

  console.log('Render with status:', status, 'error:', error, 'message:', message, 'result:', result);

  if (!status) {
    console.log('No status yet, returning null');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Shop Action Execution
        </h1>

        <div className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Initializing action...</span>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing your action request...</span>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>{error ? 'Action completed with message:' : 'Action completed successfully!'}</span>
              </div>
              {(error || message) && (
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                  <span>{error || message}</span>
                </div>
              )}
              {result && !message && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">
                    {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
                  </pre>
                </div>
              )}
            </div>
          )}

          {status === 'error' && !result && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              {message && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{message}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
