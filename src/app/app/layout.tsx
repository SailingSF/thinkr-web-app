'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import { useAuthFetch } from '@/utils/shopify';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`);
        if (!mounted) return;
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to home instead of login page
            router.replace('/');
            return;
          }
          // For other errors, we'll show the content but log the error
          console.error('Auth check error:', response.status);
        }
      } catch (error: any) {
        if (!mounted) return;
        console.error('Auth check error:', error);
        // Only redirect on auth errors, not on network errors
        if (error.message?.includes('401')) {
          router.replace('/');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [authFetch, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-xl text-purple-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      <Navigation />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 