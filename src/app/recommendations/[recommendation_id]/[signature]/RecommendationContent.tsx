'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PageState = 'loading' | 'error' | 'success';

interface RecommendationContentProps {
  recommendationId: string;
  signature: string;
}

export default function RecommendationContent({ recommendationId, signature }: RecommendationContentProps) {
  const router = useRouter();
  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState('');

  const handleAuth = useCallback(async () => {
    try {
      console.log('Starting request process...', { recommendationId, signature });
      
      // Special test case
      if (recommendationId === '123' && signature === 'test') {
        console.log('Running in test mode');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
        setState('success');
        setTimeout(() => {
          router.push('/app');
        }, 3000);
        return;
      }

      // Validate recommendation_id is a number (to match Django's <int:recommendation_id>)
      if (isNaN(Number(recommendationId))) {
        throw new Error('Invalid recommendation ID format. Must be a number.');
      }

      // Normal production flow
      const token = window?.localStorage?.getItem('auth_token');
      
      if (!token) {
        console.log('No token found, redirecting to login...');
        const currentPath = `/recommendations/${recommendationId}/${signature}`;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (!process.env.NEXT_PUBLIC_API_URL) {
        throw new Error('API URL is not configured');
      }

      console.log('Making API request...');
      // Update API path to match Django's URL pattern
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/implement/${recommendationId}/${signature}/`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('API response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setState('success');
      setTimeout(() => {
        router.push('/app');
      }, 3000);

    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing your request');
      setState('error');
    }
  }, [recommendationId, signature, router]);

  useEffect(() => {
    handleAuth();
  }, [handleAuth]);

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex items-center justify-center p-4">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative bg-[#25262b] p-8 md:p-12 rounded-2xl border border-purple-400/20 max-w-xl text-center">
          {/* Test mode indicator */}
          {recommendationId === '123' && signature === 'test' && (
            <div className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded">
              Test Mode
            </div>
          )}
          
          {state === 'loading' && (
            <div>
              <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-300">Processing your recommendation request...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your implementation steps.</p>
              <p className="text-gray-400 text-xs mt-4">Recommendation ID: {recommendationId}</p>
            </div>
          )}
          
          {state === 'error' && (
            <div>
              <h2 className="text-xl font-semibold text-red-400 mb-4">Error Processing Request</h2>
              <p className="text-gray-300 mb-6">{error}</p>
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setState('loading');
                    handleAuth();
                  }}
                  className="text-purple-400 hover:text-purple-300 block w-full"
                >
                  Try Again
                </button>
                <Link href="/app" className="text-gray-400 hover:text-gray-300 block">
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}

          {state === 'success' && (
            <div>
              <h2 className="text-xl font-semibold text-purple-400 mb-4">Success!</h2>
              <p className="text-gray-300 mb-2">Your implementation steps are being prepared and will be sent to your email shortly.</p>
              <p className="text-gray-400 text-sm mb-6">Redirecting to dashboard in a few seconds...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-400 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 