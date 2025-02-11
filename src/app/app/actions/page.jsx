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

    const pollStatus = async (actionId, taskId) => {
      try {
        console.log('Polling status for action:', actionId, 'task:', taskId);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/check-shop-action-status/?action_id=${actionId}&task_id=${taskId}`
        );
        const data = await response.json();
        console.log('Poll response:', data);

        if (!mounted) return;

        if (!response.ok) {
          setError(data.error || 'Failed to check status');
          setStatus('error');
          return false;
        }

        if (data.status === 'COMPLETED') {
          setResult(data.result);
          setStatus('completed');
          return false;
        }

        if (data.status === 'FAILED') {
          setError(data.error || 'Action failed');
          setStatus('error');
          return false;
        }

        if (data.status === 'APPROVED' || data.status === 'PENDING' || data.status === 'processing') {
          return true; // Continue polling
        }

        setError('Unknown status received');
        setStatus('error');
        return false;
      } catch (err) {
        console.error('Error polling status:', err);
        if (!mounted) return;
        setError('Failed to check status');
        setStatus('error');
        return false;
      }
    };

    const startPolling = (actionId, taskId) => {
      console.log('Starting polling for action:', actionId, 'task:', taskId);
      setStatus('processing');
      const poll = async () => {
        const shouldContinue = await pollStatus(actionId, taskId);
        if (shouldContinue && mounted) {
          timeoutId = setTimeout(poll, POLLING_INTERVAL);
        }
      };

      poll();
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

        if (!mounted) return;

        if (data.error) {
          console.log('Error in response:', data.error);
          setStatus('error');
          setError(data.error);
          if (data.result) {
            setResult(data.result);
          }
          return;
        }

        if (data.status === 'processing') {
          console.log('Action started processing, starting polling');
          setMessage(data.message); // Show "Action execution started" message
          startPolling(data.action_id, data.task_id);
          return;
        }

        // Handle any other unexpected responses
        setStatus('error');
        setError('Unexpected response from server');
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
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Shop Action Execution
        </h1>

        <div className="space-y-4">
          {status === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Processing Action</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {message || 'Your action is being processed. This may take a few moments...'}
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  Action Completed Successfully
                </span>
              </div>
              {result && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {result.message || JSON.stringify(result, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error</span>
              </div>
              <div className="text-red-600 dark:text-red-400">
                {error}
              </div>
              {result && result.message && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {result.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
