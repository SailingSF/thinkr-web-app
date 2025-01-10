'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AI_HELP_AREAS = [
  {
    id: 'marketing_strategy',
    title: 'Marketing Strategy',
    description: 'Get AI-powered insights for your marketing campaigns'
  },
  {
    id: 'inventory_optimization',
    title: 'Inventory Management',
    description: 'Optimize stock levels and reduce costs'
  },
  {
    id: 'customer_service',
    title: 'Customer Service',
    description: 'Enhance customer support and engagement'
  },
  {
    id: 'product_recommendations',
    title: 'Product Recommendations',
    description: 'Personalized suggestions for your customers'
  },
  {
    id: 'pricing_optimization',
    title: 'Pricing Strategy',
    description: 'Optimize pricing for better margins'
  },
  {
    id: 'business_analytics',
    title: 'Business Analytics',
    description: 'Data-driven insights for growth'
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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Where would you like AI to help?</h1>
        <p className="text-xl text-purple-400">Select the areas where you need AI assistance</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {AI_HELP_AREAS.map(area => (
          <button
            key={area.id}
            onClick={() => toggleArea(area.id)}
            className={`p-6 rounded-xl border transition-all text-left ${
              selectedAreas.includes(area.id)
                ? 'border-purple-400 bg-purple-500/20'
                : 'border-gray-700 bg-[#2c2d32] hover:border-purple-400/50'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">{area.title}</h3>
            <p className="text-sm text-gray-400">{area.description}</p>
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
          {isLoading ? 'Saving...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
} 