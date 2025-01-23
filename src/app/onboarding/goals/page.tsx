'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GROWTH_GOALS = [
  {
    id: 'increase_revenue',
    title: 'Increase Revenue',
    description: 'Grow your business revenue and sales'
  },
  {
    id: 'reduce_costs',
    title: 'Reduce Costs',
    description: 'Optimize operations and cut unnecessary expenses'
  },
  {
    id: 'expand_market',
    title: 'Expand Market',
    description: 'Reach new customers and enter new markets'
  },
  {
    id: 'improve_efficiency',
    title: 'Improve Efficiency',
    description: 'Streamline processes and boost productivity'
  },
  {
    id: 'enhance_customer_experience',
    title: 'Enhance Customer Experience',
    description: 'Improve customer satisfaction and loyalty'
  },
  {
    id: 'innovate_products',
    title: 'Innovate Products',
    description: 'Develop new products or improve existing ones'
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
      setError('Please select at least one growth goal');
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
            growth_goals: selectedGoals
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save growth goals');
      }

      // Move to the next step
      router.push('/onboarding/time');
    } catch (error) {
      console.error('Goals error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save growth goals');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="space-y-8 w-full max-w-2xl">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Select Your Growth Goals</h1>
          <p className="text-xl text-purple-400">What are you looking to achieve?</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {GROWTH_GOALS.map(goal => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-6 rounded-xl border transition-all text-left ${
                selectedGoals.includes(goal.id)
                  ? 'border-purple-400 bg-purple-500/20'
                  : 'border-gray-700 bg-[#2c2d32] hover:border-purple-400/50'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{goal.title}</h3>
              <p className="text-sm text-gray-400">{goal.description}</p>
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
    </div>
  );
} 