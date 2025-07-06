'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { User } from '@/hooks/useLocalStorage';

export default function Navigation() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { logout } = useAuth();
  const [storeName, setStoreName] = useState<string | null>(null);
  
  // Make navigation context optional - only use if available
  let showLogo = false;
  try {
    const navigation = useNavigation();
    showLogo = navigation.showLogo;
  } catch (error) {
    // NavigationProvider not available, that's fine
  }

  useEffect(() => {
    // Get store name from localStorage
    const getUserData = () => {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('app_data');
        if (data) {
          const parsed = JSON.parse(data) as { user: User | null };
          if (parsed.user?.store_shop_name) {
            setStoreName(parsed.user.store_shop_name);
          } else {
            setStoreName(null);
          }
        }
      }
    };
    
    getUserData();
  }, []);

  const handleLogout = () => {
    logout(); // This will clear storage and redirect to home
  };

  return (
    <nav className="sticky top-0 z-10 bg-[#141718]">
      <div className="w-full px-4 py-4 flex items-center">
        {/* Left: Hamburger/Menu and Chat History always left-aligned on mobile/tablet */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hamburger/Menu button slot (if any) */}
          {/* If you have a hamburger/menu button component, render it here. If not, this is a placeholder for your menu logic. */}
          <button className="block lg:hidden p-2 rounded bg-black text-white" aria-label="Open menu">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Chat History dropdown or any left-aligned controls should be here, so they stay left-aligned with the menu button */}
          {/* If Chat History is a component, it should be rendered here. */}
        </div>
        {/* Center: Store name if present */}
        {storeName ? (
          <div className="px-4 py-2 text-gray-300 font-medium text-center flex-1">
            {storeName}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {/* Right: Help link, always at far right on desktop */}
        <div className="flex items-center gap-4 ml-auto" style={{ minWidth: '120px' }}>
          <Link
            href="/faq"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Help
          </Link>
        </div>
      </div>
    </nav>
  );
} 