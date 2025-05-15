'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
        </div>

        {/* Title Section */}
        <div className="mb-xl md:mb-16 text-center md:text-left">
          <h1 className="text-3xl md:text-[48px] leading-tight mb-2">
            How much time do you spend<br className="hidden md:block" /> operating the business?
          </h1>
        </div>

        {error && (
          <div className="p-3 mb-md text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {/* Time Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md md:gap-x-[19px] md:gap-y-[17px] mb-lg md:mb-9">
          {TIME_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedTime(option.id)}
              className={`
                min-h-[53px] px-md md:px-lg py-md
                rounded-[4px]
                flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center
                text-base
                transition-colors
                ${selectedTime === option.id
                  ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]'
                  : 'bg-[#2C2D32] hover:bg-[#2C2D32]/80'
                }
              `}
            >
              <span className="font-medium mb-1 md:mb-0">{option.title}</span>
              <span className="text-[#6b7280] text-sm">{option.description}</span>
            </button>
          ))}
        </div>

        {/* Back and Continue Buttons */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 md:gap-0 mb-8 md:mb-0">
          <button
            onClick={() => router.back()}
            className="text-[#6b7280] hover:text-gray-400 transition-colors w-full md:w-auto text-center md:text-left py-2 md:py-0"
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