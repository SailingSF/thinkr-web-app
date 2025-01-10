'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface OnboardingLayoutProps {
  children: ReactNode;
}

const STEPS = [
  { path: '/onboarding/goals', label: 'Goals' },
  { path: '/onboarding/time', label: 'Time' },
  { path: '/onboarding/ai-help', label: 'AI Help' },
];

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const pathname = usePathname();
  const currentStepIndex = Math.max(0, STEPS.findIndex(step => step.path === pathname));

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12">
          {/* Progress steps */}
          <div className="flex items-center justify-center w-full">
            {STEPS.map((step, index) => (
              <div key={step.path} className="flex items-center">
                {/* Line before first step (empty for spacing) */}
                {index === 0 && <div className="w-8" />}
                
                {/* Step circle */}
                <div className="relative">
                  <div 
                    className={`
                      h-12 w-12 rounded-full flex items-center justify-center font-semibold transition-colors
                      ${index === currentStepIndex 
                        ? 'bg-purple-500 border-2 border-purple-300 text-white' 
                        : index < currentStepIndex
                          ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                          : 'bg-[#25262b] border-2 border-gray-700 text-gray-500'
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  <span className={`
                    absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm
                    ${index === currentStepIndex 
                      ? 'text-purple-300' 
                      : index < currentStepIndex
                        ? 'text-purple-400'
                        : 'text-gray-500'
                    }
                  `}>
                    {step.label}
                  </span>
                </div>

                {/* Line after step */}
                {index < STEPS.length - 1 && (
                  <div className={`
                    h-[2px] w-24 mx-4 transition-colors
                    ${index < currentStepIndex 
                      ? 'bg-purple-500' 
                      : 'bg-[#25262b]'
                    }
                  `} />
                )}

                {/* Line after last step (empty for spacing) */}
                {index === STEPS.length - 1 && <div className="w-8" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#25262b] rounded-xl p-8 shadow-lg border border-purple-500/20">
          {children}
        </div>
      </div>
    </div>
  );
} 