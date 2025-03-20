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
  icon: React.ReactNode;
  fields: FieldType[];
};

// Action types
const ACTION_TYPES: ActionType[] = [
  {
    id: 'inventory',
    label: 'Update Inventory Quantity',
    description: 'Increase or decrease inventory levels for products',
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
  }
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
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [executingAction, setExecutingAction] = useState(false);

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
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  // Poll for status updates
  const pollForStatus = useCallback(async () => {
    if (!taskId && !proposalId) return;
    
    try {
      console.log(`Polling for status: taskId=${taskId}, proposalId=${proposalId}`);
      
      // Prioritize using taskId for polling when available
      const queryParams = taskId 
        ? { taskId } 
        : proposalId ? { proposalId } : {};
        
      // If we have neither taskId nor proposalId, we can't poll
      if (Object.keys(queryParams).length === 0) {
        console.log('No taskId or proposalId available for polling');
        return;
      }
        
      console.log('Polling with params:', queryParams);
      const data = await autopilotApi.checkStatus(queryParams);
      
      console.log('Status response:', data);
      
      // Check for status values from the Django API
      // Map Django status to our frontend states if needed
      const statusMap: Record<string, AutopilotStatus> = {
        'processing': 'processing',
        'executing': 'executing',
        'refining': 'refining',
        'pending': 'pending',
        'ready': 'ready',
        'executed': 'executed',
        'success': 'success',
        'failed': 'failed',
        'rejected': 'rejected',
        'PENDING': 'pending',
        'APPROVED': 'approved',
        'EXECUTED': 'executed',
        'FAILED': 'failed',
        'REJECTED': 'rejected',
        'REJECTED_WITH_FEEDBACK': 'rejected'
      };
      
      const normalizedStatus = statusMap[data.status] || data.status;
      
      // If still processing, continue polling
      if (normalizedStatus === 'processing' || normalizedStatus === 'refining' || normalizedStatus === 'executing') {
        console.log(`Still ${normalizedStatus}, continuing polling...`);
        return; // Continue polling
      }
      
      // If we got here, we have a final status result - stop polling
      if (pollingInterval) {
        console.log('Received final status, clearing polling interval');
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Reset execution state
      setExecutingAction(false);
      
      // Check for proposal_id in the response
      if (data.proposal_id && !proposalId) {
        console.log('Setting proposal ID from response:', data.proposal_id);
        setProposalId(data.proposal_id);
      }
      
      // Check for task_id in the response if we don't have one yet
      if (data.task_id && !taskId) {
        console.log('Setting task ID from response:', data.task_id);
        setTaskId(data.task_id);
      }
      
      // RESULT CASE: Action was executed and completed
      if ((normalizedStatus === 'executed' || normalizedStatus === 'success') && data.result) {
        console.log('Action executed successfully, showing results:', data.result);
        setResult(data.result);
        setCurrentStep('result');
        return;
      }
      
      // PROPOSAL CASE: API returns a proposal that needs user review
      if ((normalizedStatus === 'pending' || normalizedStatus === 'ready') && data.proposal) {
        console.log('Received proposal data for review:', data.proposal);
        setProposal(data.proposal);
        
        // Only update step if we're not already in review (prevents UI jumping)
        if (currentStep !== 'review') {
          setCurrentStep('review');
        }
        return;
      }
      
      // PROPOSAL FALLBACK: For backward compatibility with older API responses
      if (data.proposal) {
        console.log('Received proposal data through fallback path:', data.proposal);
        setProposal(data.proposal);
        
        // Only update step if not already in review
        if (currentStep !== 'review') {
          setCurrentStep('review');
        }
        return;
      }
      
      // LEGACY FORMAT: Some API responses might include the proposal data directly
      if (data.explanation && data.parameters) {
        console.log('Received legacy format proposal data:', data);
        // Create a synthetic proposal object from the direct data
        const syntheticProposal: AutopilotProposal = {
          id: data.proposal_id || proposalId || '',
          proposal_id: data.proposal_id || proposalId || '',
          status: normalizedStatus,
          description: data.description || '',
          explanation: data.explanation,
          parameters: data.parameters,
          expected_outcome: data.expected_outcome,
        };
        
        setProposal(syntheticProposal);
        if (currentStep !== 'review') {
          setCurrentStep('review');
        }
        return;
      }
      
      // Error handling for failed states
      if (normalizedStatus === 'failed' || normalizedStatus === 'rejected') {
        console.error('Task failed or rejected:', data.error || 'Unknown error');
        setError(data.error || 'The task failed to complete. Please try again.');
        return;
      }
      
      // Handle generic errors
      if (data.error) {
        console.error('Error from API:', data.error);
        setError(data.error);
      }
      
    } catch (err: any) {
      console.error('Error polling for status:', err);
      setError('Failed to check proposal status. Please try again.');
      
      if (pollingInterval) clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [autopilotApi, taskId, proposalId, pollingInterval, currentStep]);

  // Submit the autopilot action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
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
      
      // First stop any existing polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Reset states that might be set from previous operations
      setProposal(null);
      setResult(null);
      
      // Set task_id from response - this is critical for status polling
      if (data.task_id) {
        setTaskId(data.task_id);
        console.log('Set task_id for polling:', data.task_id);
        
        // Update proposal_id if available
        if (data.proposal_id) {
          setProposalId(data.proposal_id);
          console.log('Also got proposal_id:', data.proposal_id);
        }
        
        // Even if we have a proposal in the response, we'll need to poll
        // for status updates until the action is complete
        
        // Show processing state while waiting for updates
        setExecutingAction(true);
        
        // If the response already contains a complete proposal, handle it
        if (data.proposal && data.status === 'pending') {
          console.log('Response includes a pending proposal:', data.proposal);
          setProposal(data.proposal);
          setCurrentStep('review');
        }
        // If we get a complete result already, show it
        else if (data.result && (data.status === 'executed' || data.status === 'success')) {
          console.log('Response already includes completed result:', data.result);
          setResult(data.result);
          setCurrentStep('result');
          setExecutingAction(false); // No need to show loading anymore
        }
        
        // Regardless of what's in the initial response, we set up polling
        // to catch any status changes or updates
        const interval = setInterval(pollForStatus, 2000);
        setPollingInterval(interval);
        
        // Poll immediately without waiting for interval
        pollForStatus();
        
        // If we don't have an immediate result or proposal, let polling handle it
      } 
      // Direct proposal in response without task_id (uncommon but possible)
      else if (data.proposal) {
        console.log('Direct proposal in response without task_id:', data.proposal);
        setProposal(data.proposal);
        
        if (data.proposal_id) {
          setProposalId(data.proposal_id);
        }
        
        setCurrentStep('review');
      }
      // Legacy format - proposal data embedded directly in response
      else if (data.status && data.parameters) {
        console.log('Legacy format proposal data in response:', data);
        
        // Use any proposal_id or create a temporary one
        if (data.proposal_id) {
          setProposalId(data.proposal_id);
        }
        
        // Create a synthetic proposal from the data
        const syntheticProposal: AutopilotProposal = {
          id: data.proposal_id || `temp-${Date.now()}`,
          proposal_id: data.proposal_id || `temp-${Date.now()}`,
          status: data.status as AutopilotStatus,
          description: data.description || description,
          explanation: data.explanation,
          parameters: data.parameters,
          expected_outcome: data.expected_outcome,
        };
        
        setProposal(syntheticProposal);
        setCurrentStep('review');
      }
      // No recognizable data in response - error case
      else {
        console.error('No task_id or proposal data in response:', data);
        setError('Invalid response from server. Could not find task ID or proposal data.');
      }
      
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      setError(err.message || 'Failed to create proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    
    try {
      if (action === 'refine' && !feedback.trim()) {
        setError('Please provide feedback for refinement');
        setIsSubmitting(false);
        return;
      }
      
      console.log(`Sending ${action} feedback for proposal ${proposalId}:`, feedback);
      const data = await autopilotApi.handleFeedback(
        proposalId,
        action,
        action === 'refine' ? feedback : undefined
      );
      console.log(`${action} feedback response:`, data);
      
      // REJECT: Reset everything and go back to action selection
      if (action === 'reject') {
        setCurrentStep('select');
        setSelectedAction(null);
        setFormData({});
        setProposalId(null);
        setTaskId(null);
        setProposal(null);
        setResult(null);
        return;
      }
      
      // APPROVE or REFINE: These both require waiting for a server response
      
      // Show loading state
      setExecutingAction(true);
      
      // Reset any existing polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Handle the response from the feedback API call
      
      // CASE 1: Response contains a task_id for polling
      if (data.task_id) {
        setTaskId(data.task_id);
        console.log(`Set task_id for polling after ${action}:`, data.task_id);
        
        // If we got a new proposal_id, update it
        if (data.proposal_id && data.proposal_id !== proposalId) {
          setProposalId(data.proposal_id);
          console.log(`Got new proposal_id after ${action}:`, data.proposal_id);
        }
        
        // For refinement, reset the current proposal so we'll recognize the new one
        if (action === 'refine') {
          setProposal(null);
        }
        
        // Check if the response already contains the status we need
        if (action === 'approve' && data.status === 'executing') {
          console.log('Proposal approved and execution started');
        } else if (action === 'refine' && data.status === 'refining') {
          console.log('Proposal refinement started');
        }
        
        // Start polling for updates (both approve and refine use polling)
        const interval = setInterval(pollForStatus, 2000);
        setPollingInterval(interval);
        
        // Poll immediately without waiting for interval
        pollForStatus();
        
        return;
      }
      
      // CASE 2: Response already contains the result (for approve)
      if (action === 'approve' && data.result) {
        console.log('Approve response already contains result:', data.result);
        setResult(data.result);
        setCurrentStep('result');
        setExecutingAction(false);
        return;
      }
      
      // CASE 3: Response already contains a new proposal (for refine)
      if (action === 'refine' && data.proposal) {
        console.log('Refine response already contains new proposal:', data.proposal);
        setProposal(data.proposal);
        
        // Update proposal_id if available and different
        if (data.proposal.id && data.proposal.id !== proposalId) {
          setProposalId(data.proposal.id);
        } else if (data.proposal_id && data.proposal_id !== proposalId) {
          setProposalId(data.proposal_id);
        }
        
        setExecutingAction(false);
        return;
      }
      
      // CASE 4: No recognizable data in response, but we'll try to handle common formats
      if (data.status === 'executing' || data.status === 'processing' || data.status === 'refining') {
        console.log(`Response indicates ${data.status} status, will continue polling`);
        
        // We'll need to poll for status updates
        const interval = setInterval(pollForStatus, 2000);
        setPollingInterval(interval);
        
        // Poll immediately
        pollForStatus();
        
        return;
      }
      
      // CASE 5: Unexpected response format
      console.error(`Unexpected response format after ${action}:`, data);
      setError(`Received unexpected response after ${action}. Please try again.`);
      setExecutingAction(false);
      
    } catch (err: any) {
      console.error(`Error ${action}ing proposal:`, err);
      setError(err.message || `Failed to ${action} proposal. Please try again.`);
      setExecutingAction(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset everything and start over
  const handleReset = () => {
    // Clear any ongoing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
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
    setExecutingAction(false);
  };

  // Update proposal ID when we get a proposal
  useEffect(() => {
    if (proposal && !proposalId && proposal.id) {
      setProposalId(proposal.id);
    }
  }, [proposal, proposalId]);
  
  // Display the processing state and ensure polling when we have a taskId
  useEffect(() => {
    // If we have a task_id but no polling interval, start polling
    if (taskId && !pollingInterval) {
      console.log('Starting polling due to new taskId:', taskId);
      setExecutingAction(true);
      
      // Start polling for status updates
      const interval = setInterval(pollForStatus, 2000);
      setPollingInterval(interval);
      
      // Poll immediately without waiting for interval
      pollForStatus();
    }
    
    // If we're in form step with a taskId, ensure we show processing
    if (taskId && !proposalId && !proposal && !result && currentStep === 'form') {
      setExecutingAction(true);
    }
    
    // Clean up interval when unmounting or when taskId changes
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [taskId, proposalId, proposal, result, currentStep, pollingInterval, pollForStatus]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col p-4 lg:p-8 bg-[#141718] font-inter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 mr-4 text-purple-400">
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4L12 2M8 8h8a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2zM10 12h.01M14 12h.01"
              />
              <circle cx="10" cy="12" r="1" fill="currentColor" />
              <circle cx="14" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Shopify Store Autopilot
          </h1>
        </div>
        <p className="text-gray-400 ml-14">
          Automate common Shopify store tasks using AI. Select an action, configure the parameters, and let our AI agent handle the execution.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6">
        {/* Step Indicator */}
        <div className="hidden lg:flex flex-col gap-4 w-64 bg-[#1c1d1f] rounded-xl p-4">
          <h2 className="text-lg font-medium text-white mb-4">Progress</h2>
          {['select', 'form', 'review', 'result'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                ${currentStep === step 
                  ? 'bg-purple-500 text-white' 
                  : index < ['select', 'form', 'review', 'result'].indexOf(currentStep) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-[#2c2d32] text-gray-400'}`}>
                {index < ['select', 'form', 'review', 'result'].indexOf(currentStep) ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={currentStep === step ? 'text-white' : 'text-gray-400'}>
                {step === 'select' && 'Select Action'}
                {step === 'form' && 'Configure'}
                {step === 'review' && 'Review'}
                {step === 'result' && 'Results'}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#1c1d1f] rounded-xl p-6 overflow-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
              <p>{error}</p>
            </div>
          )}

          {/* Step 1: Select Action Type */}
          {currentStep === 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-medium text-white mb-6">Select an action for your Shopify store</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACTION_TYPES.map((action) => (
                  <motion.div
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg cursor-pointer border-2 transition-all
                      ${selectedAction === action.id 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-gray-700 bg-[#2c2d32] hover:border-purple-500/50'}`}
                    onClick={() => {
                      setSelectedAction(action.id);
                      setCurrentStep('form');
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 flex items-center justify-center mr-3 rounded-full bg-purple-500/20 text-purple-400">
                        {action.icon}
                      </div>
                      <h3 className="text-lg font-medium text-white">{action.label}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{action.description}</p>
                  </motion.div>
                ))}
              </div>
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

                <div className="mt-6 p-4 bg-[#222326] rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Preview API Request</h4>
                  <pre className="text-xs text-gray-300 overflow-auto">
{JSON.stringify({
  description: selectedAction === 'inventory' 
    ? `Update inventory of ${formData.product_name} by ${formData.quantity_adjustment > 0 ? 'adding' : 'removing'} ${Math.abs(Number(formData.quantity_adjustment))} units` 
    : selectedAction === 'discount' 
      ? `Apply a ${formData.discount_percentage}% discount to ${formData.product_name}` 
      : '',
  initialParameters: formData
}, null, 2)}
                  </pre>
                </div>

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
  );
}
