'use client';

import { useState } from 'react';
import Navigation from "@/components/Navigation";

const storeGoals = [
  "Increase Sales",
  "Streamline Inventory",
  "Customer Insights",
  "Improve Efficiencies",
  "Optimize Marketing",
  "Other"
];

export default function StoreGoals() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleContinue = () => {
    // Handle the selected goals
    console.log('Selected goals:', selectedGoals);
    // Navigate to next step
  };

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation />

      <main className="flex flex-col items-center justify-center px-5 pt-[113.5px] pb-[191px]">
        <div className="w-full max-w-[917px] flex flex-col gap-[66px]">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-4">
            <div className="w-8 h-1 bg-[#9775fa] rounded-full" />
            <div className="w-8 h-1 bg-[#25262b] rounded-full" />
            <div className="w-8 h-1 bg-[#25262b] rounded-full" />
          </div>

          {/* Header */}
          <div className="w-[716px] max-w-full">
            <h1 className="text-[55.2px] font-normal mb-2">Select your store goals.</h1>
            <p className="text-[25px] text-[#9775fa]">Can select more than one.</p>
          </div>

          {/* Goals Grid */}
          <form className="w-full flex flex-col items-end gap-[37px]">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-[19px] gap-y-[17px]">
              {storeGoals.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`h-[53px] px-6 text-left rounded-[4px] transition-colors ${
                    selectedGoals.includes(goal)
                      ? 'bg-[#9775fa] text-white'
                      : 'bg-[#25262b] text-white hover:bg-[#2c2d31]'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>

            <button
              onClick={handleContinue}
              disabled={selectedGoals.length === 0}
              className="w-[449px] max-w-full h-12 bg-[#9775fa] hover:bg-[#8465e5] rounded-[4px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}