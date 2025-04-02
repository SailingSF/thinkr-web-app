'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthFetch } from '@/utils/shopify';
import { createAutopilotApi } from '@/lib/autopilot-api';
import { AutopilotProposal, AutopilotResult, AutopilotStatus } from '@/types/api';

// Define field types for type safety
type FieldType = {
  name: string;
  label: string;
  placeholder?: string;
  type: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string | number;
};

// Define action type structure
type ActionType = {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  fields: FieldType[];
  comingSoon?: boolean;
};

// Add a LoadingOverlay component for consistent loading UI
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-[#1c1d1f] p-6 rounded-xl max-w-md w-full">
      <div className="flex items-center justify-center mb-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-white text-center">{message}</p>
    </div>
  </div>
);

// Action types
const ACTION_TYPES: ActionType[] = [
  {
    id: 'inventory',
    label: 'Update Inventory Quantity',
    description: 'Increase or decrease inventory levels for products',
    category: 'Inventory',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    fields: [
      { name: 'product_name', label: 'Product Name', placeholder: 'e.g., Black T-shirt, Blue Hoodie', type: 'text', required: true },
      { name: 'quantity_adjustment', label: 'Quantity Adjustment', placeholder: '10 to add, -5 to remove', type: 'number', required: true },
      { name: 'reason', label: 'Reason for Adjustment', placeholder: 'e.g., New shipment received, Inventory correction', type: 'text', required: true },
      { name: 'variant_id', label: 'Variant ID (Optional)', placeholder: 'gid://shopify/ProductVariant/123456789', type: 'text' },
    ],
  },
  {
    id: 'discount',
    label: 'Apply Percentage Discount',
    description: 'Reduce product prices by a percentage',
    category: 'Marketing',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    fields: [
      { name: 'product_name', label: 'Product Name', placeholder: 'e.g., Blue Hoodie, Black T-shirt', type: 'text', required: true },
      { name: 'discount_percentage', label: 'Discount Percentage', placeholder: 'e.g., 20 for 20% discount', type: 'number', required: true },
      { name: 'currency_code', label: 'Currency Code (Optional)', placeholder: 'e.g., USD, CAD, EUR', type: 'text', defaultValue: 'USD' },
      { name: 'round_to', label: 'Round To (Optional)', placeholder: 'e.g., 0.99 for $19.99, 0.95 for $19.95', type: 'number', defaultValue: 0.99 },
    ],
  },
  // New "coming soon" action types
  {
    id: 'bulk_tag',
    label: 'Bulk Add Product Tags',
    description: 'Add tags to multiple products at once',
    category: 'Marketing',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'auto_seo',
    label: 'Auto-Optimize SEO',
    description: 'Generate optimized titles, descriptions, and alt texts',
    category: 'Marketing',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'abandon_cart',
    label: 'Customize Abandoned Cart Emails',
    description: 'Create personalized abandoned cart recovery emails',
    category: 'Customer Service',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'product_bundles',
    label: 'Create Product Bundles',
    description: 'Bundle products together with special pricing',
    category: 'Inventory',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'seasonal_promo',
    label: 'Schedule Seasonal Promotions',
    description: 'Set up time-based discounts for holidays and events',
    category: 'Marketing',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008H16.5V15z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'auto_social',
    label: 'Auto-Generate Social Media Posts',
    description: 'Create social media content for your products',
    category: 'Marketing',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'customer_segment',
    label: 'Create Customer Segments',
    description: 'Group customers based on buying behavior',
    category: 'Customer Service',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
  {
    id: 'cross_sell',
    label: 'Setup Cross-Sell Recommendations',
    description: 'Create intelligent product recommendations',
    category: 'Customer Service',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    comingSoon: true,
    fields: [],
  },
];

// Main component
export default function Autopilot() {
  const authFetch = useAuthFetch();
  const autopilotApi = useMemo(() => createAutopilotApi(authFetch), [authFetch]);
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'form' | 'review' | 'result'>('select');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<AutopilotProposal | null>(null);
  const [result, setResult] = useState<AutopilotResult | null>(null);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [feedback, setFeedback] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [executingAction, setExecutingAction] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredActions, setFilteredActions] = useState<ActionType[]>(ACTION_TYPES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Most Popular');

  // Get the selected action type details
  const selectedActionType = ACTION_TYPES.find(action => action.id === selectedAction);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Set default values when an action is selected
  useEffect(() => {
    if (selectedActionType) {
      const defaults: Record<string, any> = {};
      selectedActionType.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
      setFormData(defaults);
    }
  }, [selectedActionType]);

  // Clear polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        console.log('Clearing polling interval on unmount');
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Helper function to stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      console.log('Stopping polling');
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    // Always ensure these states are properly reset when stopping polling
    setExecutingAction(false);
    setLoadingMessage(null);
    setIsSubmitting(false);
  }, [pollingInterval]);

  // Helper function to start polling
  const startPolling = useCallback((newTaskId: string) => {
    // First stop any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null); // Ensure we reset this state
    }
    
    console.log(`Starting polling for taskId: ${newTaskId}`);
    setTaskId(newTaskId);
    setExecutingAction(true);
    setLoadingMessage('Processing your request...'); // Ensure loading message is set
    
    // Track consecutive errors to implement exponential backoff
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5; // Allow up to 5 errors before stopping
    
    const fetchStatusWithWindow = async (taskId: string) => {
      try {
        // Use window.fetch with minimal options to avoid CORS preflight
        // Include only essential auth headers
        const url = `${process.env.NEXT_PUBLIC_API_URL}/autopilot/status/?task_id=${taskId}`;
        
        // Try to get auth headers from an existing fetch function
        let headers = {};
        try {
          // Get any existing auth cookies from document.cookie
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>);
          
          // If we have an authorization cookie, use it
          if (cookies['Authorization']) {
            headers = { 'Authorization': cookies['Authorization'] };
          }
        } catch (cookieErr) {
          console.error('Error getting auth cookies:', cookieErr);
        }
        
        const response = await window.fetch(url, {
          method: 'GET',
          credentials: 'include', // Include cookies for auth
          headers, // Include minimal headers for auth if available
        });
        
        if (!response.ok) {
          // If authentication failed, try using the authFetch as fallback
          if (response.status === 401 || response.status === 403) {
            console.log('Authentication failed with simple fetch, trying authFetch');
            const authResponse = await autopilotApi.checkStatus({ taskId });
            return authResponse;
          }
          throw new Error(`Status check failed with status: ${response.status}`);
        }
        
        // Parse response
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Error in window.fetch status check:', err);
        
        // If window.fetch fails for any reason, try the autopilotApi as a fallback
        try {
          console.log('Falling back to autopilotApi.checkStatus');
          const fallbackData = await autopilotApi.checkStatus({ taskId });
          return fallbackData;
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          throw err; // Re-throw the original error if fallback also fails
        }
      }
    };
    
    const newPollFunction = async () => {
      if (!newTaskId) return;
      
      console.log(`Polling for taskId=${newTaskId}`);
      
      try {
        // Try using window.fetch for status check - simplest possible method to avoid preflight
        const statusData = await fetchStatusWithWindow(newTaskId);
        console.log('Poll response (window.fetch):', statusData);
        
        // Status check succeeded, reset consecutive errors counter
        consecutiveErrors = 0;
        
        // Safety check to ensure we have data
        if (!statusData) {
          console.error('Empty status response');
          return;
        }
        
        // Update loading message based on status
        if (statusData.status === 'processing') {
          setLoadingMessage('Processing your request...');
        } else if (statusData.status === 'refining') {
          setLoadingMessage('Refining the proposal...');
        } else if (statusData.status === 'executing') {
          setLoadingMessage('Executing the action...');
        } else if (statusData.status === 'completed' || statusData.status === 'success') {
          // Don't set a completion message, we'll clear it right after updating the state
          
          // Stop polling when we get a completed/success status
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setExecutingAction(false);
          setIsSubmitting(false);
          
          // Handle the result or proposal
          if (statusData.result) {
            console.log('Setting result from poll:', statusData.result);
            setResult(statusData.result);
            setCurrentStep('result');
            // Clear loading message immediately after setting the result
            setLoadingMessage(null);
          } else if (statusData.proposal) {
            console.log('Setting proposal from poll:', statusData.proposal);
            setProposal(statusData.proposal);
            setProposalId(statusData.proposal.id || statusData.proposal_id);
            setCurrentStep('review');
            // Clear loading message immediately after setting the proposal
            setLoadingMessage(null);
          } else {
            console.warn('Completed status but no result or proposal found');
            // Fall back to showing form again if we have no data
            setCurrentStep('form');
            setLoadingMessage(null);
          }
        } else {
          console.log(`Unknown status: ${statusData.status}`);
        }
      } catch (err) {
        console.error('Error polling for status:', err);
        consecutiveErrors++;
        
        // Only display error after several consecutive failures
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`Multiple polling errors (${consecutiveErrors}), showing error message`);
          setError(`We're having trouble checking the status. Please wait or try again.`);
          
          // Even after consecutive errors, we'll keep trying
          // Don't stop the polling interval, just let the user know there's an issue
        }
      }
    };
    
    // Poll immediately once
    newPollFunction().catch(err => {
      console.error('Error in initial poll:', err);
      // Don't abort on initial poll error, the interval will retry
    });
    
    // Then set up the interval - save it in a variable first to ensure it's set
    const interval = setInterval(newPollFunction, 2000);
    console.log('Created new polling interval:', interval);
    setPollingInterval(interval);
    
    // Return the interval ID in case we need to clear it outside
    return interval;
  }, [pollingInterval]);

  // Poll for status updates - for manual polling if needed
  const pollForStatus = useCallback(async () => {
    console.log(`Manual pollForStatus called, taskId: ${taskId}`);
    
    if (!taskId) {
      console.log('No taskId for polling, skipping');
      return;
    }
    
    try {
      // Use window.fetch with proper auth
      const url = `${process.env.NEXT_PUBLIC_API_URL}/autopilot/status/?task_id=${taskId}`;
      console.log('Making manual status request to:', url);
      
      // Try to get auth headers
      let headers = {};
      try {
        // Get any existing auth cookies from document.cookie
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        // If we have an authorization cookie, use it
        if (cookies['Authorization']) {
          headers = { 'Authorization': cookies['Authorization'] };
        }
      } catch (cookieErr) {
        console.error('Error getting auth cookies:', cookieErr);
      }
      
      const response = await window.fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
        headers, // Include minimal headers for auth if available
      });
      
      if (!response.ok) {
        // If authentication failed, try using the API client
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication failed in manual poll, trying API client');
          const apiData = await autopilotApi.checkStatus({ taskId });
          console.log('API client manual status check response:', apiData);
          
          // Handle API client response
          if (!apiData) {
            console.error('Empty API status response');
            return;
          }
          
          // Update loading message based on status
          handleStatusUpdate(apiData);
          return;
        }
        throw new Error(`Manual status check failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Manual status check response:', data);
      
      // Safety check
      if (!data) {
        console.error('Empty status response');
        return;
      }
      
      // Handle the status update
      handleStatusUpdate(data);
    } catch (err) {
      console.error('Error in manual poll:', err);
      
      // Try the API client as fallback
      try {
        console.log('Trying API client as fallback for manual poll');
        const apiData = await autopilotApi.checkStatus({ taskId });
        handleStatusUpdate(apiData);
      } catch (apiErr) {
        console.error('API fallback for manual poll also failed:', apiErr);
        // Don't stop polling on error - let the interval continue
      }
    }
    
    // Helper function to handle status updates
    function handleStatusUpdate(data: any) {
      // Update loading message based on status
      if (data.status) {
        if (data.status === 'processing') {
          setLoadingMessage('Processing your request...');
        } else if (data.status === 'refining') {
          setLoadingMessage('Refining the proposal...');
        } else if (data.status === 'executing') {
          setLoadingMessage('Executing the action...');
        } else if (data.status === 'completed' || data.status === 'success') {
          // Don't set a completion message here either
          
          // Stop polling when completed
          stopPolling();
          
          // Handle result or proposal
          if (data.result) {
            console.log('Setting result from manual poll:', data.result);
            setResult(data.result);
            setCurrentStep('result');
            // Clear loading message
            setLoadingMessage(null);
          } else if (data.proposal) {
            console.log('Setting proposal from manual poll:', data.proposal);
            setProposal(data.proposal);
            setProposalId(data.proposal.id || data.proposal_id);
            setCurrentStep('review');
            // Clear loading message
            setLoadingMessage(null);
          } else {
            console.warn('Completed status but no result or proposal found');
            // Clear loading message
            setLoadingMessage(null);
          }
        }
      }
    }
  }, [taskId, stopPolling, autopilotApi]);

  // Submit the autopilot action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setLoadingMessage('Submitting your request...');
    
    try {
      // Build request payload based on action type
      let description = '';
      
      if (selectedAction === 'inventory') {
        description = `Update inventory of ${formData.product_name} by ${formData.quantity_adjustment > 0 ? 'adding' : 'removing'} ${Math.abs(Number(formData.quantity_adjustment))} units`;
      } else if (selectedAction === 'discount') {
        description = `Apply a ${formData.discount_percentage}% discount to ${formData.product_name}`;
      }
      
      console.log('Creating proposal with:', { description, initialParameters: formData });
      const data = await autopilotApi.createProposal(description, formData);
      console.log('Create proposal response:', data);
      
      // Reset states that might be set from previous operations
      setProposal(null);
      setResult(null);
      setProposalId(null);
      
      // If we immediately have a completed status with a proposal, show it
      if ((data.status === 'completed' || data.status === 'success') && data.proposal) {
        console.log('Immediate proposal available');
        setProposal(data.proposal);
        setProposalId(data.proposal.id || data.proposal_id);
        setCurrentStep('review');
        setIsSubmitting(false);
        setLoadingMessage(null);
        return;
      }
      
      // Extract the task_id from the response
      if (data.task_id) {
        startPolling(data.task_id);
      } else {
        console.error('No task_id in create response');
        setError('Failed to create task. Please try again.');
        setIsSubmitting(false);
        setLoadingMessage(null);
      }
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      setError(err.message || 'Failed to create proposal. Please try again.');
      setIsSubmitting(false);
      setLoadingMessage(null);
    }
  };

  // Handle user feedback on proposal (approve, reject, refine)
  const handleProposalAction = async (action: 'approve' | 'reject' | 'refine') => {
    if (!proposalId) {
      setError('No proposal ID found. Cannot process feedback.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    // For 'approve' action, we don't want to stop the polling right away,
    // but we need to reset it to use the new task_id we'll get
    if (action !== 'approve') {
      // Make sure any existing polling is stopped for other actions
      stopPolling();
    }
    
    // Set appropriate loading message based on action
    if (action === 'approve') {
      setLoadingMessage('Approving and executing...');
    } else if (action === 'reject') {
      setLoadingMessage('Rejecting proposal...');
    } else if (action === 'refine') {
      setLoadingMessage('Sending refinement feedback...');
    }
    
    try {
      if (action === 'refine' && !feedback.trim()) {
        setError('Please provide feedback for refinement');
        setIsSubmitting(false);
        setLoadingMessage(null);
        return;
      }
      
      console.log(`Sending ${action} feedback for proposal ${proposalId}`);
      
      // Implement retry logic for feedback request
      let retryCount = 0;
      const MAX_RETRIES = 3;
      let data = null;
      
      while (retryCount < MAX_RETRIES) {
        try {
          data = await autopilotApi.handleFeedback(
            proposalId,
            action,
            action === 'refine' ? feedback : undefined
          );
          // Success - break out of retry loop
          break;
        } catch (retryErr) {
          retryCount++;
          console.warn(`Feedback attempt ${retryCount} failed:`, retryErr);
          
          if (retryCount >= MAX_RETRIES) {
            // Let it bubble up to the main catch
            throw retryErr;
          }
          
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, retryCount * 500));
        }
      }
      
      console.log(`${action} feedback response:`, data);
      
      // For reject, reset and go back to action selection
      if (action === 'reject') {
        setCurrentStep('select');
        setSelectedAction(null);
        setFormData({});
        setProposalId(null);
        setTaskId(null);
        setProposal(null);
        setResult(null);
        setIsSubmitting(false);
        setLoadingMessage(null);
        return;
      }
      
      // For immediate responses
      if (data && (data.status === 'completed' || data.status === 'success')) {
        if (data.result) {
          console.log('Immediate result available after feedback');
          setResult(data.result);
          setCurrentStep('result');
          setIsSubmitting(false);
          setLoadingMessage(null);
          return;
        } else if (data.proposal) {
          console.log('Immediate proposal available after feedback');
          setProposal(data.proposal);
          setProposalId(data.proposal.id || data.proposal_id);
          setCurrentStep('review');
          setIsSubmitting(false);
          setLoadingMessage(null);
          return;
        }
      }
      
      // For approve action, ensure we stop any existing polling before starting new one
      if (action === 'approve') {
        // Stop any existing polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
      
      // For async responses, start polling with the new task_id
      if (data && data.task_id) {
        console.log(`Starting polling for feedback action=${action} with taskId=${data.task_id}`);
        
        // Start fresh polling with the new task ID - this should continue regardless of action type
        const interval = startPolling(data.task_id);
        console.log('New polling interval created:', interval);
        
        // For approve action specifically - make sure we stay in executing state
        if (action === 'approve') {
          setExecutingAction(true);
        }
      } else {
        // If no task_id and no immediate result, but we have an old task_id,
        // try to continue polling the old task_id as a fallback
        console.warn('No new task_id in feedback response. Checking for existing taskId.');
        
        if (taskId) {
          console.log('Attempting to poll existing taskId:', taskId);
          const interval = startPolling(taskId);
          console.log('Fallback polling interval created:', interval);
        } else {
          // No task_id at all - just show generic message
          console.warn('No task_id available for polling');
          setIsSubmitting(false);
          setLoadingMessage(null);
          
          // Add safety check - if we've sent approval but got no task_id,
          // try to manually poll once to see if there's any update
          if (action === 'approve') {
            console.log('Attempting direct status check after approve action');
            try {
              // Use window.fetch with minimal auth options to avoid CORS preflight
              const url = `${process.env.NEXT_PUBLIC_API_URL}/autopilot/status/?proposal_id=${proposalId}`;
              
              // Try to get auth headers
              let headers = {};
              try {
                // Get any existing auth cookies from document.cookie
                const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                  const [key, value] = cookie.trim().split('=');
                  acc[key] = value;
                  return acc;
                }, {} as Record<string, string>);
                
                // If we have an authorization cookie, use it
                if (cookies['Authorization']) {
                  headers = { 'Authorization': cookies['Authorization'] };
                }
              } catch (cookieErr) {
                console.error('Error getting auth cookies:', cookieErr);
              }
              
              const response = await window.fetch(url, {
                method: 'GET',
                credentials: 'include', // Include cookies for auth
                headers, // Include minimal headers for auth if available
              });
              
              if (!response.ok) {
                // If authentication failed, try using the authFetch as fallback
                if (response.status === 401 || response.status === 403) {
                  console.log('Authentication failed with simple fetch, trying authFetch');
                  const statusData = await autopilotApi.checkStatus({ proposalId });
                  console.log('Auth API status check response:', statusData);
                  
                  // Use the response from the API client
                  if (statusData && (statusData.status === 'completed' || statusData.status === 'success')) {
                    if (statusData.result) {
                      setResult(statusData.result);
                      setCurrentStep('result');
                    } else if (statusData.proposal) {
                      setProposal(statusData.proposal);
                      setProposalId(statusData.proposal.id || statusData.proposal_id);
                      setCurrentStep('review');
                    }
                  } else if (taskId) {
                    // If no immediate result and we have a taskId, start polling it
                    console.log('No immediate result from API but we have taskId, starting polling:', taskId);
                    const interval = startPolling(taskId);
                    console.log('Started polling after API check with interval:', interval);
                  }
                  return;
                }
                throw new Error(`Direct status check failed with status: ${response.status}`);
              }
              
              const statusData = await response.json();
              console.log('Direct status check response:', statusData);
              
              // If successful, update UI based on status
              if (statusData && (statusData.status === 'completed' || statusData.status === 'success')) {
                if (statusData.result) {
                  setResult(statusData.result);
                  setCurrentStep('result');
                } else if (statusData.proposal) {
                  setProposal(statusData.proposal);
                  setProposalId(statusData.proposal.id || statusData.proposal_id);
                  setCurrentStep('review');
                }
              } else if (taskId) {
                // If no immediate result and we have a taskId, start polling it
                console.log('No immediate result but we have taskId, starting polling:', taskId);
                const interval = startPolling(taskId);
                console.log('Started polling after direct check with interval:', interval);
              }
            } catch (statusErr) {
              console.error('Direct status check failed:', statusErr);
              
              // Try API client as fallback if direct check fails
              try {
                console.log('Trying API client after direct check failure');
                const apiStatusData = await autopilotApi.checkStatus({ proposalId });
                console.log('API fallback status response:', apiStatusData);
                
                if (apiStatusData && (apiStatusData.status === 'completed' || apiStatusData.status === 'success')) {
                  if (apiStatusData.result) {
                    setResult(apiStatusData.result);
                    setCurrentStep('result');
                    return;
                  } else if (apiStatusData.proposal) {
                    setProposal(apiStatusData.proposal);
                    setProposalId(apiStatusData.proposal.id || apiStatusData.proposal_id);
                    setCurrentStep('review');
                    return;
                  }
                }
              } catch (apiErr) {
                console.error('API fallback also failed:', apiErr);
              }
              
              // If direct check fails but we have a taskId, start polling it
              if (taskId) {
                console.log('Direct check failed but we have taskId, starting polling:', taskId);
                const interval = startPolling(taskId);
                console.log('Started polling after failed direct check with interval:', interval);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`Error ${action}ing proposal:`, err);
      setError(err.message || `Failed to ${action} proposal. Please try again.`);
      
      // If we encounter an error but have a taskId, try polling it as a last resort
      if (taskId && action === 'approve') {
        console.log('Error encountered, but attempting to poll existing taskId as recovery:', taskId);
        const interval = startPolling(taskId);
        console.log('Recovery polling interval created:', interval);
      } else {
        setIsSubmitting(false);
        setLoadingMessage(null);
      }
      
      // If we encounter an error and action is not approve, stop any ongoing polling
      if (action !== 'approve') {
        stopPolling();
      }
    }
  };

  // Reset everything and start over
  const handleReset = () => {
    stopPolling();
    
    // Reset all state
    setCurrentStep('select');
    setSelectedAction(null);
    setFormData({});
    setProposalId(null);
    setTaskId(null);
    setProposal(null);
    setResult(null);
    setError(null);
    setFeedback('');
  };

  // Ensure we stop polling when reaching final states
  useEffect(() => {
    if (currentStep === 'result') {
      stopPolling();
    }
    // We no longer stop polling when reaching the review step
    // This allows polling to continue when approving from the review step
  }, [currentStep, stopPolling]);

  // Update proposal ID when we get a proposal
  useEffect(() => {
    if (proposal && !proposalId && proposal.id) {
      setProposalId(proposal.id);
    }
  }, [proposal, proposalId]);

  // Safety mechanism: if we have an active taskId but no polling interval,
  // and we're not in a final state, restart polling
  useEffect(() => {
    const isActiveState = currentStep !== 'review' && currentStep !== 'result';
    
    if (taskId && !pollingInterval && executingAction && isActiveState) {
      console.log('Safety mechanism: restarting polling for taskId:', taskId);
      const interval = startPolling(taskId);
      console.log('Restarted polling interval:', interval);
    }
  }, [taskId, pollingInterval, executingAction, currentStep, startPolling]);

  // Debug logging for state changes
  useEffect(() => {
    console.log(`State updated - Step: ${currentStep}, TaskId: ${taskId}, Polling: ${!!pollingInterval}, Executing: ${executingAction}`);
  }, [currentStep, taskId, pollingInterval, executingAction]);

  // Also add an effect to clear the loading message when we reach the result step
  useEffect(() => {
    if (currentStep === 'result') {
      // When we reach the result step, ensure loading and error states are cleared
      stopPolling();
      setLoadingMessage(null);
      setIsSubmitting(false);
      setExecutingAction(false);
    }
  }, [currentStep, stopPolling]);

  // Handle action selection
  const handleActionSelect = (actionId: string) => {
    const action = ACTION_TYPES.find(action => action.id === actionId);
    
    // Check if the action is coming soon
    if (action && action.comingSoon) {
      setError(
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400">
              Coming Soon
            </span>
          </div>
          <p>The "{action.label}" action is coming soon! Check back later for updates.</p>
        </div>
      );
      return;
    }
    
    // Otherwise proceed normally
    setSelectedAction(actionId);
    setCurrentStep('form');
    setError(null); // Clear any previous errors
  };

  // Filter actions based on search query
  useEffect(() => {
    let filtered = ACTION_TYPES;

    // Filter by search query if present
    if (searchQuery) {
      filtered = filtered.filter(action =>
        action.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category if one is selected (and it's not "All" or "Most Popular")
    if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'Most Popular') {
      filtered = filtered.filter(action => action.category === selectedCategory);
    }

    // Apply sorting
    if (selectedSort === 'Recently Added') {
      // For this example, we'll just reverse the array to simulate "recently added"
      filtered = [...filtered].reverse();
    }
    // For "Most Popular" sorting, we'll keep the default order which is assumed to be by popularity

    setFilteredActions(filtered);
  }, [searchQuery, selectedCategory, selectedSort]);

  return (
    <div className="h-full bg-[#141718] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
      <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-12">
        {/* Loading Overlay */}
        {loadingMessage && <LoadingOverlay message={loadingMessage} />}
        
        {/* Header */}
        <div>
          <h1 className="text-[40px] text-[#8B5CF6] font-normal mb-2">
            Autopilot
          </h1>
          <p className="text-[22px] text-white font-normal mb-8">
            Automate everyday store tasks.
          </p>
          <div className="h-[1px] w-full bg-white mb-8"></div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-[#1E1F20] rounded-lg p-6">
              {/* Sort By Section */}
              <div className="mb-8">
                <h2 className="text-[#9CA3AF] font-medium mb-4 uppercase text-[13px] tracking-wider">SORTED BY</h2>
                <div className="flex flex-col gap-2">
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedSort === 'Most Popular' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedSort('Most Popular')}
                  >
                    <span className="text-white text-[14px]">Most Popular</span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedSort === 'Recently Added' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedSort('Recently Added')}
                  >
                    <span className="text-white text-[14px]">Recently Added</span>
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              <div>
                <h2 className="text-[#9CA3AF] font-medium mb-4 uppercase text-[13px] tracking-wider">CATEGORIES</h2>
                <div className="flex flex-col gap-2">
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedCategory === 'All' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedCategory('All')}
                  >
                    <span className="text-white text-[14px]">All</span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedCategory === 'Inventory' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedCategory('Inventory')}
                  >
                    <span className="text-white text-[14px]">Inventory</span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedCategory === 'Marketing' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedCategory('Marketing')}
                  >
                    <span className="text-white text-[14px]">Marketing</span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedCategory === 'Finance' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedCategory('Finance')}
                  >
                    <span className="text-white text-[14px]">Finance</span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded cursor-pointer ${selectedCategory === 'Customer Service' ? 'bg-[#2C2D32]' : 'hover:bg-[#2C2D32]/70'}`}
                    onClick={() => setSelectedCategory('Customer Service')}
                  >
                    <span className="text-white text-[14px]">Customer Service</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
                {typeof error === 'string' ? <p>{error}</p> : error}
              </div>
            )}

            {/* Step 1: Select Action */}
            {currentStep === 'select' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredActions.map((action) => (
                  <div key={action.id} className="bg-[#1E1F20] rounded-lg p-6 flex flex-col h-[280px]">
                    <h3 className="text-[18px] font-medium text-white mb-2">{action.label}</h3>
                    <p className="text-gray-400 text-[14px] mb-4">{action.description}</p>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`${
                          action.category === 'Marketing' ? 'bg-[#f59e0b]' :
                          action.category === 'Customer Service' ? 'bg-[#10b981]' :
                          'bg-[#8763E580]'
                        } text-white text-[13px] px-3 py-1 rounded min-w-[100px] max-w-[120px] min-h-[28px] flex items-center justify-center text-center`}>
                          {action.category}
                        </div>
                        <span className="text-gray-400 text-[13px] ml-2">
                          {/* You can add actual adoption rates here if available */}
                          {Math.floor(Math.random() * (95 - 75) + 75)}% adoption
                        </span>
                      </div>
                      {!action.comingSoon && (
                        <button
                          onClick={() => handleActionSelect(action.id)}
                          className="bg-[#8763E550] text-white text-[13px] px-4 py-[10px] rounded hover:bg-[#8763E580] transition-colors w-full flex items-center justify-center font-medium"
                        >
                          Configure in Autopilot
                        </button>
                      )}
                      {action.comingSoon && (
                        <div className="text-center text-amber-400 text-[13px] px-4 py-[10px]">
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 2: Configure Action */}
            {currentStep === 'form' && selectedActionType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white">Configure {selectedActionType.label}</h2>
                  <button
                    onClick={() => setCurrentStep('select')}
                    className="text-gray-400 hover:text-white text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                  </button>
                </div>
                
                {/* Action specific help text */}
                <div className="mb-6 p-4 bg-purple-900/20 border border-purple-400/30 rounded-lg text-gray-300">
                  {selectedAction === 'inventory' && (
                    <div className="space-y-2">
                      <p>This action allows you to adjust the inventory quantity of a specific product.</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Use positive numbers to add inventory (e.g., 10)</li>
                        <li>Use negative numbers to remove inventory (e.g., -5)</li>
                        <li>Reason for adjustment is required</li>
                        <li>Variant ID is optional - if not provided, the action will affect the first variant</li>
                      </ul>
                    </div>
                  )}

                  {selectedAction === 'discount' && (
                    <div className="space-y-2">
                      <p>This action applies a percentage discount to a product and sets compare-at prices.</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Enter the percentage value only (e.g., 20 for 20% discount)</li>
                        <li>Round To controls price rounding (0.99 gives prices like $19.99)</li>
                        <li>The original price will be shown as a compare-at price</li>
                      </ul>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {selectedActionType.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label htmlFor={field.name} className="block text-sm font-medium text-gray-300">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full px-4 py-2 rounded-lg bg-[#2c2d32] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={4}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          required={field.required}
                          className="w-full px-4 py-2 rounded-lg bg-[#2c2d32] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full px-4 py-2 rounded-lg bg-[#2c2d32] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:bg-purple-700 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Review Proposal */}
            {currentStep === 'review' && proposal && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white">Review Proposal</h2>
                  <button
                    onClick={() => setCurrentStep('form')}
                    className="text-gray-400 hover:text-white text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                  </button>
                </div>

                <div className="mb-6 p-4 bg-purple-900/20 border border-purple-400/30 rounded-lg text-gray-300">
                  <h3 className="text-lg font-medium mb-2">Proposal Details</h3>
                  <p className="text-sm">{proposal.description}</p>
                </div>

                <div className="mb-6 p-4 bg-[#222326] rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Proposal Parameters</h4>
                  <pre className="text-xs text-gray-300 overflow-auto">
{JSON.stringify(proposal.parameters, null, 2)}
                  </pre>
                </div>

                <div className="mb-6 p-4 bg-[#222326] rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Expected Outcome</h4>
                  <p className="text-xs text-gray-300">{proposal.expected_outcome}</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleProposalAction('approve')}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:bg-green-700 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleProposalAction('refine')}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors disabled:bg-yellow-700 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Refining...' : 'Refine'}
                  </button>
                  <button
                    onClick={() => handleProposalAction('reject')}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:bg-red-700 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Show Result */}
            {currentStep === 'result' && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white">Action Result</h2>
                  <button
                    onClick={() => setCurrentStep('select')}
                    className="text-gray-400 hover:text-white text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                  </button>
                </div>

                <div className="mb-6 p-4 bg-green-900/20 border border-green-400/30 rounded-lg text-gray-300">
                  <h3 className="text-lg font-medium mb-2">Action Completed Successfully</h3>
                  <p className="text-sm">{result.summary}</p>
                  {result.message && (
                    <p className="text-sm mt-2 text-green-300">{result.message}</p>
                  )}
                </div>

                <div className="mb-6 p-4 bg-[#222326] rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Result Details</h4>
                  {result.details ? (
                    <pre className="text-xs text-gray-300 overflow-auto">
{JSON.stringify(result.details, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-400">No additional details available</p>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2 px-4 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  Start Over
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
