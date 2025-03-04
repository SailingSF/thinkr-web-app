'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { logout } = useAuth();
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    // Get store name from localStorage
    const getUserData = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            if (parsed.store) {
              setStoreName(parsed.store);
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
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
    <nav className="fixed top-0 right-0 p-4 z-10">
      <div className="flex items-center gap-4 mr-8">
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