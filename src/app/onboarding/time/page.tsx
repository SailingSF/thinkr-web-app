'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TIME_OPTIONS = [
  {
    id: 'full_time',
    title: 'Full Time',
    description: '40+ hrs/week',
  },
  {
    id: 'part_time',
    title: 'Part-Time',
    description: '20-40 hrs/week',
  },
  {
    id: 'side_hustle',
    title: 'Side Hustle',
    description: '10-20 hrs/week',
  },
  {
    id: 'minimal',
    title: 'Minimal',
    description: '<10 hrs/week',
  }
];

export default function OnboardingTime() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedTime) {
      setError('Please select how much time you spend on your business');
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
            how_much_time_on_business: selectedTime
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save time investment');
      }

      // Move to the next step
      router.push('/onboarding/ai-help');
    } catch (error) {
      console.error('Time investment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save time investment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1B1E] text-white">
      {/* Header */}
      <header className="h-[101px] border-b border-[#2C2D32]">
        <div className="h-full max-w-[1800px] mx-auto px-4 md:px-12 flex justify-between items-center">
          <div className="text-[22px] font-tofino tracking-[-0.05em]">thinkr</div>
          <nav className="hidden md:flex gap-14">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            <Link href="/app" className="hover:text-gray-300">App</Link>
            <Link href="/faq" className="hover:text-gray-300">FAQ</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[917px] mx-auto mt-[60px] md:mt-[114px] px-4 md:px-5">
        {/* Progress Dots */}
        <div className="flex gap-2 mb-6 md:mb-9 justify-center md:justify-start">
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
        </div>

        {/* Title Section */}
        <div className="mb-8 md:mb-16">
          <h1 className="text-[32px] md:text-[48px] leading-tight mb-2 text-center md:text-left">
            How much time do you spend<br className="hidden md:block" /> operating the business?
          </h1>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {/* Time Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-[19px] md:gap-y-[17px] mb-6 md:mb-9">
          {TIME_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedTime(option.id)}
              className={`
                min-h-[53px] px-4 md:px-6 py-3 md:py-0
                rounded-[4px]
                flex justify-between items-center
                text-base
                transition-colors
                ${selectedTime === option.id
                  ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]'
                  : 'bg-[#2C2D32] hover:bg-[#2C2D32]/80'
                }
              `}
            >
              <span>{option.title}</span>
              <span className="text-[#6b7280] text-sm ml-2">{option.description}</span>
            </button>
          ))}
        </div>

        {/* Back and Continue Buttons */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 md:gap-0">
          <button
            onClick={() => router.back()}
            className="text-[#6b7280] hover:text-gray-400 transition-colors w-full md:w-auto text-center md:text-left"
          >
            Back
          </button>
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