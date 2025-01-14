import { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

// Declare Shopify types for the window object
declare global {
  interface Window {
    shopify?: {
      navigate: (path: string) => void;
      sessionToken: () => Promise<string>;
    };
  }
}

export function isShopifyEmbedded(): boolean {
  return typeof window !== 'undefined' && window.top !== window.self;
}

export function getShopifyHost(): string | null {
  if (typeof window === 'undefined') return null;
  return new URL(window.location.href).searchParams.get('host');
}

interface AppBridgeProviderProps {
  children: ReactNode;
}

export function ShopifyAppBridgeProvider({ children }: AppBridgeProviderProps): ReactNode {
  useEffect(() => {
    // Only add the script tag if we're in the embedded environment
    if (isShopifyEmbedded() && !document.querySelector('script[data-app-bridge]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
      script.dataset.appBridge = 'true';
      script.dataset.appBridgeConfig = JSON.stringify({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID,
        host: getShopifyHost(),
        forceRedirect: true
      });
      document.head.insertBefore(script, document.head.firstChild);
    }
  }, []);

  return children;
}

export function useAuthFetch() {
  return useCallback(async (url: string, options: RequestInit = {}) => {
    let token = null;
    
    // Try to get token from cookie first
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth_token='));
    if (authCookie) {
      token = authCookie.split('=')[1];
      console.log('Using token from cookie');
    } else if (!isShopifyEmbedded()) {
      // Fallback to localStorage in standalone mode
      token = localStorage.getItem('auth_token');
      console.log('Using token from localStorage');
    }

    if (!token && !isShopifyEmbedded()) {
      console.log('No auth token found, redirecting to login');
      window.location.href = '/login?reason=session_expired';
      throw new Error('No authentication token found');
    }

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers
    });
  }, []);
}

export function useHybridNavigation() {
  return {
    navigate: (path: string) => {
      if (isShopifyEmbedded() && window.shopify) {
        window.shopify.navigate(path);
      } else {
        window.location.href = path;
      }
    }
  };
} 