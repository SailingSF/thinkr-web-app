'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

// Simple request cache with AbortController to handle race conditions
const requestCache = new Map<string, { promise: Promise<Response>; controller: AbortController }>();

export function useAuthFetch() {
  const tokenRef = useRef<string | null>(null);

  // Only read token once on mount and only on client side
  useEffect(() => {
    if (tokenRef.current === null && !isShopifyEmbedded() && typeof window !== 'undefined') {
      tokenRef.current = localStorage.getItem('auth_token');
    }
  }, []);

  return useCallback(async (url: string, options: RequestInit = {}) => {
    const token = tokenRef.current;

    if (!token && !isShopifyEmbedded()) {
      window.location.href = '/login?reason=session_expired';
      throw new Error('No authentication token found');
    }

    // Create a cache key based on the URL and method
    const cacheKey = `${options.method || 'GET'}:${url}`;
    
    // If there's an existing request in progress, abort it
    if (requestCache.has(cacheKey)) {
      requestCache.get(cacheKey)?.controller.abort();
    }

    // Create a new AbortController for this request
    const controller = new AbortController();
    
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }

    const fetchPromise = fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers
    }).finally(() => {
      // Clean up cache entry after request completes
      requestCache.delete(cacheKey);
    });

    // Cache the request
    requestCache.set(cacheKey, { promise: fetchPromise, controller });

    return fetchPromise;
  }, []); // No dependencies needed since we use refs
}

// Shopify embedded app utilities
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

export function useHybridNavigation() {
  return {
    navigate: useCallback((path: string) => {
      if (isShopifyEmbedded() && window.shopify) {
        window.shopify.navigate(path);
      } else {
        window.location.href = path;
      }
    }, [])
  };
} 