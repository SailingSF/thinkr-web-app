'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TIME_OPTIONS = [
  {
    id: 'full_time',
    title: 'Full-time',
    description: '40+ hours per week',
    hours: '40+'
  },
  {
    id: 'part_time',
    title: 'Part-time',
    description: '20-40 hours per week',
    hours: '20-40'
  },
  {
    id: 'side_hustle',
    title: 'Side Hustle',
    description: '10-20 hours per week',
    hours: '10-20'
  },
  {
    id: 'minimal',
    title: 'Minimal',
    description: 'Less than 10 hours per week',
    hours: '<10'
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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">How much time do you spend on your business?</h1>
        <p className="text-xl text-purple-400">This helps us understand your commitment level</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {TIME_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => setSelectedTime(option.id)}
            className={`p-6 rounded-xl border transition-all text-left ${
              selectedTime === option.id
                ? 'border-purple-400 bg-purple-500/20'
                : 'border-gray-700 bg-[#2c2d32] hover:border-purple-400/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{option.title}</h3>
              <span className="text-sm text-purple-400 font-medium">
                {option.hours} hrs/week
              </span>
            </div>
            <p className="text-sm text-gray-400">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-transparent hover:bg-[#2c2d32] rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
} 