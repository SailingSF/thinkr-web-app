'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding-data/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch onboarding data');
        }

        const { data } = await response.json();
        
        // Check which step to redirect to based on completed data
        if (!data.growth_goals) {
          router.push('/onboarding/goals');
        } else if (!data.how_much_time_on_business) {
          router.push('/onboarding/time');
        } else if (!data.where_ai_helps) {
          router.push('/onboarding/ai-help');
        } else {
          // Onboarding complete
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Onboarding status error:', error);
        // On error, default to first onboarding step
        router.push('/onboarding/goals');
      }
    };

    checkOnboardingStatus();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-purple-400">Loading...</div>
    </div>
  );
} 