'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, User } from '@/hooks/useLocalStorage';

export default function Profile() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData, isExpired } = useLocalStorage();
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const [user, setUser] = useState<User | null>(storedData?.user || null);
  const [loading, setLoading] = useState(!storedData?.user);
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;

    async function fetchUserData() {
      if (fetchingRef.current || initialLoadDoneRef.current) return;
      
      if (!isExpired && storedData?.user) {
        setUser(storedData.user);
        setLoading(false);
        initialLoadDoneRef.current = true;
        return;
      }

      fetchingRef.current = true;

      try {
        const userResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`);
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();

        if (mountedRef.current) {
          setUser(userData);
          updateStoredData({ user: userData });
          setError('');
        }
      } catch (err) {
        console.error('Profile error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load profile data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          initialLoadDoneRef.current = true;
        }
        fetchingRef.current = false;
      }
    }

    fetchUserData();

    return () => {
      mountedRef.current = false;
    };
  }, [authFetch, router, isExpired]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-8 lg:py-12 font-inter">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Title Section */}
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-[35px] text-[#FFFFFF] font-normal m-0">
            Profile Settings
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-[#2C2C2E] rounded-2xl p-6 lg:p-8 max-w-2xl">
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-[#8C74FF]/10">
              <div className="w-12 h-12 bg-[#8C74FF]/10 rounded-full flex items-center justify-center">
                <span className="text-xl text-[#8C74FF] font-medium">
                  {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg text-white font-medium">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : 'User'}
                </h2>
                <p className="text-[#7B7B7B] text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Store Information */}
            <div className="flex justify-between items-center pb-6 border-b border-[#8C74FF]/10">
              <div>
                <h3 className="text-lg text-white mb-2">Store Information</h3>
                <p className="text-[#7B7B7B]">{user?.store || 'No store connected'}</p>
              </div>
              <div className="text-[#8C74FF]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Current Plan */}
            <div className="flex justify-between items-center pb-6 border-b border-[#8C74FF]/10">
              <div>
                <h3 className="text-lg text-white mb-2">Current Plan</h3>
                <p className="text-[#7B7B7B]">Free</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-[#8C74FF]/10 text-[#8C74FF] rounded-full">
                Free
              </span>
            </div>

            {/* Active Integrations */}
            <div className="pb-6 border-b border-[#8C74FF]/10">
              <h3 className="text-lg text-white mb-4">Active Integrations</h3>
              <div className="flex gap-2">
                {user?.store && (
                  <span className="px-4 py-1.5 bg-[#141718] text-white rounded-full text-sm">
                    Shopify
                  </span>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="flex justify-between items-center py-4 border-b border-[#8C74FF]/10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-[#8C74FF]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="text-white">Notifications</span>
              </div>
              <button className="px-4 py-1.5 bg-[#141718] text-white rounded-lg text-sm hover:bg-[#1c1e1f] transition-colors">
                Configure
              </button>
            </div>

            {/* Billing */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-[#8C74FF]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-white">Billing</span>
              </div>
              <Link 
                href="#"
                className="px-4 py-1.5 bg-[#141718] text-white rounded-lg text-sm hover:bg-[#1c1e1f] transition-colors"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 