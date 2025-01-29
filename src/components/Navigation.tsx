'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '@/utils/shopify';
import { useAuth } from '@/hooks/useAuth';

export default function Navigation() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout/`, {
        method: 'POST',
      });

      if (response.ok) {
        // Clear auth state
        logout();
        // Clear any stored tokens or session data
        localStorage.removeItem('shopify_token');
        sessionStorage.clear();
        // Redirect to home page
        router.replace('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 right-0 p-4 z-10">
      <div className="flex items-center gap-4 mr-8">
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