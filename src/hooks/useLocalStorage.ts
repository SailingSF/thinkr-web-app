import { useState, useEffect } from 'react';

export interface User {
  email: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  store_shopify_domain: string | null;
  store_shop_name: string | null;
  store_primary_domain_url: string | null;
  peaka_project_id: string | null;
  phone?: string;
  timezone?: string;
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

export interface Alert {
  id: number;
  name: string;
  metric: 'inventory_level' | 'orders_count' | 'revenue' | 'customer_count';
  parameters: Record<string, any>;
  instructions?: string;
  threshold_type: 'gt' | 'lt';
  threshold_value: number;
  frequency: string;
  next_run?: string;
  last_evaluated?: string;
  last_triggered?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertRequest {
  name: string;
  metric: 'inventory_level' | 'orders_count' | 'revenue' | 'customer_count';
  parameters: Record<string, any>;
  instructions?: string;
  threshold_type: 'gt' | 'lt';
  threshold_value: number;
  frequency: string;
}

export interface UsageStatus {
  alerts: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface StoredData {
  user: User | null;
  connectionStatus: ConnectionStatus | null;
  schedules: Schedule[] | null;
  alerts: Alert[] | null;
  usageStatus: UsageStatus | null;
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