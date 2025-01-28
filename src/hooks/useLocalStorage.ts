import { useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  shopify_user_id: number;
  store: string | null;
}

export interface ConnectionStatus {
  is_connected: boolean;
  shop_domain: string | null;
  last_sync: string | null;
  subscription_status: string;
}

export interface Schedule {
  id: number;
  analysis_type: string;
  cron_expression: string;
  is_active: boolean;
  description: string;
  last_run: string | null;
  next_run: string | null;
}

interface StoredData {
  user: User | null;
  connectionStatus: ConnectionStatus | null;
  schedules: Schedule[] | null;
  lastUpdated: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useLocalStorage() {
  const [storedData, setStoredData] = useState<StoredData | null>(null);

  useEffect(() => {
    // Load initial data from localStorage
    const loadStoredData = () => {
      const data = localStorage.getItem('app_data');
      if (data) {
        const parsed = JSON.parse(data) as StoredData;
        // Check if the cache is still valid
        if (Date.now() - parsed.lastUpdated < CACHE_DURATION) {
          setStoredData(parsed);
        } else {
          // Clear expired cache
          localStorage.removeItem('app_data');
          setStoredData(null);
        }
      }
    };

    loadStoredData();
  }, []);

  const updateStoredData = (newData: Partial<StoredData>) => {
    const updatedData: StoredData = {
      ...storedData,
      ...newData,
      lastUpdated: Date.now(),
    } as StoredData;

    localStorage.setItem('app_data', JSON.stringify(updatedData));
    setStoredData(updatedData);
  };

  const clearStoredData = () => {
    localStorage.removeItem('app_data');
    setStoredData(null);
  };

  return {
    storedData,
    updateStoredData,
    clearStoredData,
    isExpired: !storedData || Date.now() - storedData.lastUpdated >= CACHE_DURATION,
  };
} 