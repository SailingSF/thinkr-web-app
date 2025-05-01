'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { User } from '@/hooks/useLocalStorage';

export default function Navigation() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { logout } = useAuth();
  const [storeName, setStoreName] = useState<string | null>(null);

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
      <div className="container mx-auto px-4 py-4 flex justify-end items-center gap-4">
        {storeName && (
          <div className="px-4 py-2 text-gray-300 font-medium">
            {storeName}
          </div>
        )}
        <Link
          href="/faq"
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Help
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#232627] rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
} 