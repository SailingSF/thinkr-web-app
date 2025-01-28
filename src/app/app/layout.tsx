'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="min-h-screen bg-[#141718] text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-purple-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141718] text-white">
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 