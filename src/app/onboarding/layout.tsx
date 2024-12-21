'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { path: '/onboarding', label: 'Store Info' },
  { path: '/onboarding/goals', label: 'Goals' },
  { path: '/onboarding/connect-store', label: 'Connect Store' }
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStepIndex = Math.max(0, STEPS.findIndex(step => step.path === pathname));
  const progress = Math.min(100, ((currentStepIndex + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-purple-400">thinkr</div>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className="hover:text-purple-400 transition-colors py-2">Home</Link>
          <Link href="/pricing" className="hover:text-purple-400 transition-colors py-2">Pricing</Link>
          <Link href="/faqs" className="hover:text-purple-400 transition-colors py-2">FAQs</Link>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
          <div 
            className="h-full bg-purple-500 transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Steps indicator */}
      <div className="container mx-auto px-8 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <div 
                key={step.path}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="relative flex items-center justify-center">
                  <div 
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                      ${index <= currentStepIndex 
                        ? 'border-purple-400 bg-purple-500/20 text-purple-400' 
                        : 'border-gray-600 text-gray-600'
                      }`}
                  >
                    {index + 1}
                  </div>
                  <span 
                    className={`absolute top-10 whitespace-nowrap text-sm
                      ${index <= currentStepIndex ? 'text-purple-400' : 'text-gray-600'}`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={`h-[2px] flex-1 mx-4 mt-4
                      ${index < currentStepIndex ? 'bg-purple-400' : 'bg-gray-600'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-16">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 