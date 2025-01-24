'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/onboarding/goals');
  }, [router]);

  return null;
} 