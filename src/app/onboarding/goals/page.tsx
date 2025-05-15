'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const STORE_GOALS = [
  {
    id: 'increase-sales',
    title: 'Increase Sales'
  },
  {
    id: 'streamline-inventory',
    title: 'Streamline Inventory'
  },
  {
    id: 'customer-insights',
    title: 'Customer Insights'
  },
  {
    id: 'improve-efficiencies',
    title: 'Improve Efficiencies'
  },
  {
    id: 'optimize-marketing',
    title: 'Optimize Marketing'
  },
  {
    id: 'other',
    title: 'Other'
  }
];

export default function GoalsPage() {
  const router = useRouter();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least one store goal');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }

      // Transform the selected goals into the expected format
      const formattedGoals = selectedGoals.join(',');  // Convert array to comma-separated string
      console.log('Sending business goals:', formattedGoals);
      
      const response = await fetch(`${apiUrl}/onboarding-data/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          updates: {
            business_goals: formattedGoals
          }
        }),
        credentials: 'include'
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        console.log('Raw response:', data);
      }

      if (!response.ok) {
        console.error('API Error Response:', response.status, data);
        if (data?.error) {
          throw new Error(`${data.error}: ${data.details || ''}`);
        }
        throw new Error('Failed to save store goals');
      }

      console.log('Store goals saved successfully:', data);
      
      // Add a small delay before navigation to ensure the save completes
      setTimeout(() => {
        router.push('/onboarding/time');
      }, 500);
    } catch (error) {
      console.error('Goals error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save store goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1B1E] text-white">
      {/* Header */}
      <header className="h-auto md:h-[101px] border-b border-[#2C2D32]">
        <div className="h-full max-w-[1800px] mx-auto px-4 md:px-12 py-4 md:py-0 flex flex-col md:flex-row justify-between items-center relative">
          <div className="flex w-full md:w-auto justify-between items-center">
            <div className="text-[22px] font-tofino tracking-[-0.05em]">
              <Image
                src="/thinkr-logo-white.png"
                alt="Thinkr Logo"
                width={108}
                height={36}
                priority
                className="object-contain w-24 md:w-auto"
              />
            </div>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto items-center gap-4 md:gap-14 mt-4 md:mt-0`}>
            <Link href="/" className="hover:text-gray-300 py-2 md:py-0">Home</Link>
            <Link href="/app" className="hover:text-gray-300 py-2 md:py-0">App</Link>
            <Link href="/faq" className="hover:text-gray-300 py-2 md:py-0">FAQ</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[917px] mx-auto mt-xl md:mt-[114px] px-md md:px-0">
        {/* Progress Dots */}
        <div className="flex gap-md mb-lg md:mb-9 justify-center md:justify-start">
          <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
        </div>

        {/* Title Section */}
        <div className="mb-xl md:mb-16 text-center md:text-left">
          <h1 className="text-3xl md:text-[48px] leading-tight mb-2">Select your store goals.</h1>
          <p className="text-[#7C5CFC] text-xl md:text-2xl">Can select more than one.</p>
        </div>

        {error && (
          <div className="p-3 mb-md text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md md:gap-x-[19px] md:gap-y-[17px] mb-lg md:mb-9">
          {STORE_GOALS.map(goal => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`
                h-[53px] px-md md:px-lg
                rounded-[4px]
                text-left
                text-base
                transition-colors
                ${selectedGoals.includes(goal.id)
                  ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]'
                  : 'bg-[#2C2D32] hover:bg-[#2C2D32]/80'
                }
              `}
            >
              {goal.title}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center md:justify-end mb-8 md:mb-0">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="
              w-full md:w-[449px] h-12
              bg-[#7C5CFC]
              rounded-[4px]
              font-normal
              transition-colors
              hover:bg-[#7C5CFC]/90
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </main>
    </div>
  );
} 