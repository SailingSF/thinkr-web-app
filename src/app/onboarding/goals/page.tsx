'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GOALS = [
  {
    id: 'increase_sales',
    title: 'Increase Sales',
    description: 'Boost your revenue and conversion rates'
  },
  {
    id: 'manage_inventory',
    title: 'Manage Inventory',
    description: 'Optimize stock levels and reduce costs'
  },
  {
    id: 'customer_insights',
    title: 'Customer Insights',
    description: 'Understand your customers better'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Custom goals and requirements'
  }
];

export default function OnboardingGoals() {
  const router = useRouter();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least one goal');
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
            business_goals: selectedGoals
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save goals');
      }

      // Move to the next step
      router.push('/onboarding/connect-store');
    } catch (error) {
      console.error('Goals error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save goals');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Please select the goals you are looking to achieve</h1>
        <p className="text-xl text-purple-400">Can select more than one.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {GOALS.map(goal => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-6 rounded-xl border transition-all ${
              selectedGoals.includes(goal.id)
                ? 'border-purple-400 bg-purple-500/20'
                : 'border-gray-700 bg-[#25262b] hover:border-purple-400/50'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">{goal.title}</h3>
            <p className="text-sm text-gray-400">{goal.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-transparent hover:bg-gray-800 rounded font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
} 