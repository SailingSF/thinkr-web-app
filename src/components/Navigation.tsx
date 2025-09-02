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
        {/* Left: Chat History always left-aligned on mobile/tablet */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Chat History dropdown or any left-aligned controls should be here */}
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
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#2A2D2E] text-gray-200 hover:text-white border border-[#3A3D3E] hover:border-purple-400/50 rounded-lg transition-colors"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
} 