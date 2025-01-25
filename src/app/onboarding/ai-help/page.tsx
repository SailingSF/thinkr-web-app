'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AI_HELP_AREAS = [
  {
    id: 'automation',
    title: 'Automation',
    description: 'Streamline your business processes'
  },
  {
    id: 'analytics_forecasting',
    title: 'Analytics & Forecasting',
    description: 'Data-driven insights and predictions'
  },
  {
    id: 'knowledge_information',
    title: 'Knowledge & Information',
    description: 'Access and organize business knowledge'
  },
  {
    id: 'not_sure',
    title: 'Not Sure',
    description: 'Explore AI possibilities'
  }
];

export default function OnboardingAIHelp() {
  const router = useRouter();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleSubmit = async () => {
    if (selectedAreas.length === 0) {
      setError('Please select at least one area where AI can help');
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
            where_ai_helps: selectedAreas
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save AI help preferences');
      }

      // Complete onboarding and move to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('AI help preferences error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save AI help preferences');
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
          <div className="w-2 h-2 rounded-full bg-[#2C2D32]" />
          <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
        </div>

        {/* Title Section */}
        <div className="mb-8 md:mb-16">
          <h1 className="text-[32px] md:text-[48px] leading-tight mb-2 text-center md:text-left">
            How would you think AI would<br className="hidden md:block" /> best help your business?
          </h1>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {/* AI Help Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-[19px] md:gap-y-[17px] mb-6 md:mb-9">
          {AI_HELP_AREAS.map(area => (
            <button
              key={area.id}
              onClick={() => toggleArea(area.id)}
              className={`
                h-[52px] px-6
                rounded-[4px]
                flex items-center
                text-base
                transition-colors
                ${selectedAreas.includes(area.id)
                  ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]'
                  : 'bg-[#2C2D32] hover:bg-[#2C2D32]/80'
                }
              `}
            >
              <span>{area.title}</span>
            </button>
          ))}
        </div>

        {/* Back and Continue Buttons */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 md:gap-0">
          <button
            onClick={() => router.back()}
            className="text-[#6b7280] hover:text-gray-400 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="
              w-full md:w-[449px] h-[52px]
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