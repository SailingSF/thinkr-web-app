'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from "@/components/AppSidebar";
import Navigation from "@/components/Navigation";
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
            router.replace('/');
            return;
          }
          console.error('Auth check error:', response.status);
        }
      } catch (error: any) {
        if (!mounted) return;
        console.error('Auth check error:', error);
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
      <div className="min-h-screen bg-[#141718] flex items-center justify-center">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#141718] overflow-hidden">
      <Navigation />
      <AppSidebar />
      <main className="lg:pl-[336px] pt-16 p-4 h-[calc(100vh-1rem)] overflow-auto dark-scrollbar">
        {children}
      </main>
    </div>
  );
} 