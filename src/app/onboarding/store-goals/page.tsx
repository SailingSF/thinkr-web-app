'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const STORE_GOALS = [
  {
    id: 'increase-sales',
    title: 'Increase Sales',
    description: 'Boost your revenue'
  },
  {
    id: 'streamline-inventory',
    title: 'Streamline Inventory',
    description: 'Optimize stock management'
  },
  {
    id: 'customer-insights',
    title: 'Customer Insights',
    description: 'Understand your customers better'
  },
  {
    id: 'improve-efficiencies',
    title: 'Improve Efficiencies',
    description: 'Streamline operations'
  },
  {
    id: 'optimize-marketing',
    title: 'Optimize Marketing',
    description: 'Enhance marketing strategies'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Custom goals'
  }
];

export default function StoreGoals() {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding-data/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          updates: {
            store_goals: selectedGoals
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save store goals');
      }

      // Move to the next step
      router.push('/onboarding/time');
    } catch (error) {
      console.error('Store goals error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save store goals');
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
                src="/2 Thinkr logo white letter.png"
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
      <main className="max-w-[917px] mx-auto mt-8 md:mt-[114px] px-4 md:px-0">
        {/* Progress Dots */}
        <div className="flex gap-2 mb-6 md:mb-9 justify-center md:justify-start">
          <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
        </div>

        {/* Title Section */}
        <div className="mb-8 md:mb-16 text-center md:text-left">
          <h1 className="text-3xl md:text-[48px] leading-tight mb-2">Select your store goals.</h1>
          <p className="text-[#7C5CFC] text-xl md:text-2xl">Can select more than one.</p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-[19px] md:gap-y-[17px] mb-6 md:mb-9">
          {STORE_GOALS.map(goal => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`
                min-h-[53px] px-4 md:px-6 py-3
                rounded-[4px]
                flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center
                text-base
                transition-colors
                ${selectedGoals.includes(goal.id)
                  ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]'
                  : 'bg-[#2C2D32] hover:bg-[#2C2D32]/80'
                }
              `}
            >
              <span className="font-medium mb-1 md:mb-0">{goal.title}</span>
              <span className="text-[#6b7280] text-sm">{goal.description}</span>
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