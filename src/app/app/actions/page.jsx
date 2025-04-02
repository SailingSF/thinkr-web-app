'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const POLLING_INTERVAL = 2000; // Poll every 2 seconds
const MAX_RETRIES = 3; // Maximum number of retries for task ID issues
const RETRY_DELAY = 1000; // Wait 1 second between retries

export default function ActionsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const executionAttempted = useRef(false);
  const retryCount = useRef(0);

  useEffect(() => {
    console.log('Effect started, current status:', status);
    let mounted = true;
    let timeoutId = null;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const pollStatus = async (actionId, taskId, isRetry = false) => {
      try {
        console.log('Polling status for action:', actionId, 'task:', taskId, 'isRetry:', isRetry);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/check-shop-action-status/?action_id=${actionId}&task_id=${taskId}`
        );
        const data = await response.json();
        console.log('Poll response:', data);

        if (!mounted) return;

        // Handle task ID validation errors with retry logic
        if (!response.ok && data.error && 
            (data.error === 'Invalid task ID' || data.error === 'No task ID found in cache')) {
          if (!isRetry && retryCount.current < MAX_RETRIES) {
            console.log(`Task ID validation failed, retrying (${retryCount.current + 1}/${MAX_RETRIES})`);
            retryCount.current++;
            await delay(RETRY_DELAY);
            return await pollStatus(actionId, taskId, true);
          }
          setError(data.error);
          setStatus('error');
          return false;
        }

        // Reset retry count on successful response
        retryCount.current = 0;

        if (!response.ok) {
          setError(data.error || 'Failed to check status');
          setStatus('error');
          return false;
        }

        const currentStatus = data.status?.toLowerCase();

        if (currentStatus === 'completed') {
          setResult(data.result);
          setStatus('completed');
          return false;
        }

        if (currentStatus === 'failed') {
          setError(data.error || 'Action failed');
          setStatus('error');
          return false;
        }

        if (currentStatus === 'approved') {
          setStatus('processing');
          setMessage('Action approved, waiting for processing to begin...');
          return true; // Continue polling
        }

        if (currentStatus === 'pending' || currentStatus === 'processing') {
          setStatus('processing');
          return true; // Continue polling
        }

        console.log('Unexpected status received:', data.status);
        setError(`Unexpected status: ${data.status}`);
        setStatus('error');
        return false;
      } catch (err) {
        console.error('Error polling status:', err);
        if (!mounted) return;
        
        // Also apply retry logic for network errors
        if (!isRetry && retryCount.current < MAX_RETRIES) {
          console.log(`Network error, retrying (${retryCount.current + 1}/${MAX_RETRIES})`);
          retryCount.current++;
          await delay(RETRY_DELAY);
          return await pollStatus(actionId, taskId, true);
        }

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
          if (data.status === 'completed') {
            // Handle case where action was already processed
            setStatus('completed');
            setError(data.error);
            if (data.result) {
              setResult(data.result);
            }
          } else {
            setStatus('error');
            setError(data.error);
          }
          return;
        }

        if (data.status === 'processing' && data.action_id && data.task_id) {
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
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-4 lg:py-6 font-inter">
      <div className="h-full overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-[35px] text-[#8B5CF6] font-normal mb-2">
              Shop Action
            </h1>
            <p className="text-[22px] text-white font-normal mb-6">
              Monitor your shop action execution status.
            </p>
            <hr className="border-t border-white mb-8" />
          </div>

          {/* Main Content */}
          <div className="max-w-2xl">
            <div className="bg-[#1E1F20] rounded-2xl p-8 shadow-lg">
              <div className="space-y-4">
                {status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#7B6EF6]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Processing Action</span>
                    </div>
                    <p className="text-gray-300">
                      {message || 'Your action is being processed. This may take a few moments...'}
                    </p>
                  </div>
                )}

                {status === 'completed' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-500">
                        Action Completed Successfully
                      </span>
                    </div>
                    {result && (
                      <div className="bg-[#232627] rounded-lg p-4">
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {result.message || JSON.stringify(result, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {status === 'error' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-red-500">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <div className="text-red-500">
                      {error}
                    </div>
                    {result && result.message && (
                      <div className="bg-[#232627] rounded-lg p-4">
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {result.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
