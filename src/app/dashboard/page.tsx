'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ConnectionStatus {
  is_connected: boolean;
  shop_domain: string | null;
  last_sync: string | null;
  subscription_status: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  shopify_user_id: number;
  store: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Get connection status
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch connection status');
        }

        const data = await response.json();
        setConnectionStatus(data);
        
        // Get user data from localStorage (set during login)
        const userData = localStorage.getItem('user_data');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] text-white flex items-center justify-center">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-purple-400">thinkr</div>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="px-4 py-2 hover:bg-[#25262b] rounded-md transition-colors"
          >
            Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 hover:bg-[#25262b] rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="container mx-auto px-8 py-12">
        {error && (
          <div className="mb-8 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-8">
          {/* User Information */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user?.first_name || 'User'}!</h2>
            <div className="space-y-2 text-gray-300">
              <p>Email: {user?.email}</p>
              <p>Contact Email: {user?.contact_email}</p>
            </div>
          </div>

          {/* Store Connection Status */}
          <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
            <h2 className="text-2xl font-bold mb-4">Store Connection Status</h2>
            {connectionStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    connectionStatus.is_connected ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-lg">
                    {connectionStatus.is_connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {connectionStatus.shop_domain && (
                  <p className="text-gray-300">Store: {connectionStatus.shop_domain}</p>
                )}
                {connectionStatus.last_sync && (
                  <p className="text-gray-300">
                    Last Synced: {new Date(connectionStatus.last_sync).toLocaleString()}
                  </p>
                )}
                <p className="text-gray-300">
                  Subscription: <span className="capitalize">{connectionStatus.subscription_status}</span>
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Unable to fetch connection status</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 