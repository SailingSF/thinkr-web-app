'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    contact_email: string;
    shopify_user_id: number;
    store: string | null;
  };
  error?: string;
  debug_info?: {
    email_provided: string;
    user_exists: boolean;
  };
}

interface ConnectionResponse {
  is_connected: boolean;
  error?: string;
}

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // Login request
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginResult = await loginResponse.json() as LoginResponse;

      if (!loginResponse.ok) {
        if (loginResult.error === 'Invalid credentials') {
          throw new Error('Invalid email or password');
        }
        if (loginResult.error === 'Please provide both email and password') {
          throw new Error('Please fill in all fields');
        }
        throw new Error(loginResult.error || 'Login failed');
      }

      // Store the token in localStorage for subsequent requests
      if (loginResult.token) {
        localStorage.setItem('auth_token', loginResult.token);
        // Also store user data
        if (loginResult.user) {
          localStorage.setItem('user_data', JSON.stringify(loginResult.user));
        }
      }

      // Check if user has a store connected from the login response
      if (!loginResult.user?.store) {
        router.push('/connect-store');
        return;
      }

      // If user has a store, verify it's properly connected
      try {
        const connectionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connection-status/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${loginResult.token}`,
          },
        });
        
        if (!connectionResponse.ok) {
          // If connection check fails, redirect to connect store
          router.push('/connect-store');
          return;
        }

        const connectionStatus = await connectionResponse.json() as ConnectionResponse;

        // Redirect based on store connection status
        if (connectionStatus.is_connected) {
          router.push('/dashboard');
        } else {
          router.push('/connect-store');
        }
      } catch (connectionError) {
        // If connection check fails, redirect to connect store
        console.error('Connection check error:', connectionError);
        router.push('/connect-store');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-purple-400">thinkr</div>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className="hover:text-purple-400 transition-colors py-2">Home</Link>
          <Link href="/app" className="hover:text-purple-400 transition-colors py-2">App</Link>
          <Link href="/faq" className="hover:text-purple-400 transition-colors py-2">FAQ</Link>
          <Link 
            href="/login" 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Login Form */}
      <main className="flex flex-col items-center justify-center px-8 pt-20 pb-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-gray-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 w-full px-4 py-3 rounded bg-[#25262b] border border-gray-700 focus:border-purple-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-700 bg-[#25262b] text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
} 