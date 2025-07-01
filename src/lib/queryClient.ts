import { QueryClient } from '@tanstack/react-query';

// Create a singleton QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: false, // Only refetch if data is stale
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient; 