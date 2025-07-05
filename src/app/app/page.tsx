'use client';

import React from 'react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Plus, ArrowUp, X, ChevronDown, Bot, MessageCircle, Hexagon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

import SegmentedModeSelector from '@/components/SegmentedModeSelector';
import { Connection } from '@/components/SegmentedModeSelector';
import MessageList from '@/components/MessageList';
import AgentPreviewDrawer from '@/components/AgentPreviewDrawer';
import ErrorBoundary from '@/components/ErrorBoundary';
import ShopifyConnectButton from '@/components/ShopifyConnectButton';
import AuditCard from '@/components/AuditCard';
import ShopifyErrorModal from '@/components/ShopifyErrorModal';
import { useNavigation } from '@/contexts/NavigationContext';
import { useChat, useChatUI } from '@/hooks/useChat';
import { ChatIntent, AgentSpecification } from '@/types/chat';
import { useLocalStorage, ConnectionStatus } from '@/hooks/useLocalStorage';
import { AGENT_TYPES } from '@/components/icons/AgentIcons';
import { useAuthFetch } from '@/utils/shopify';
import queryClient from '@/lib/queryClient';

// Interface for Fivetran connections
interface FivetranConnection {
  id: number;
  fivetran_connector_id: string;
  service: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Available services mapping (same as integrations page)
const AVAILABLE_SERVICES = [
  { id: 'google_ads', name: 'Google Ads', icon: '/google-ads-icon-2.png' },
  { id: 'facebook_ads', name: 'Meta Ads', icon: '/meta-icon-2.png' },
  { id: 'google_analytics_4', name: 'Google Analytics', icon: '/google-analytics-icon.png' },
  { id: 'klaviyo', name: 'Klaviyo', icon: '/klaviyo-white-icon.png' },
  { id: 'gorgias', name: 'Gorgias', icon: '/gorgias-icon.png' },
  { id: 'pinterest_ads', name: 'Pinterest Ads', icon: '/pinterest-icon.png' },
];

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  store_shopify_domain: string | null;
  store_shop_name: string | null;
  store_primary_domain_url: string | null;
  store_audit_sent: boolean;
}

interface ApiConnectionStatus {
  is_connected: boolean;
  shop_domain?: string;
  error?: string;
}

function ChatShell() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { setShowLogo } = useNavigation();
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const [isConnectingShopify, setIsConnectingShopify] = useState(false);
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [shopifyError, setShopifyError] = useState('');
  const [showShopifyErrorModal, setShowShopifyErrorModal] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fivetranConnections, setFivetranConnections] = useState<FivetranConnection[]>([]);
  
  // Dismissed states from localStorage
  const [dismissedShopify, setDismissedShopify] = useState(false);
  const [dismissedAudit, setDismissedAudit] = useState(false);
  
  const {
    mode,
    setMode,
    agentDrawerOpen,
    currentAgentSpec,
    closeAgentDrawer,
  } = useChatUI();

  const {
    messages,
    threads,
    error,
    isLoading,
    sendMessage,
    createAgent,
    clearError,
    createAgentLoading,
    resetChat,
  } = useChat({ 
    threadId: currentThreadId, 
    intent: mode,
    onThreadChange: setCurrentThreadId
  });

  const { storedData } = useLocalStorage();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add state for search
  const [chatSearch, setChatSearch] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Control navigation logo visibility based on message count
  useEffect(() => {
    const hasUserMessages = messages.some(m => m.role === 'user');
    setShowLogo(hasUserMessages);
  }, [messages, setShowLogo]);

  // Load dismissed states from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissedShopify(localStorage.getItem('dismissed_shopify_connect') === 'true');
      setDismissedAudit(localStorage.getItem('dismissed_store_audit') === 'true');
    }
  }, []);

  // Fetch user data from /user/ endpoint on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setUserDataLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json() as UserData;
          setUserData(data);
          console.log('User data loaded:', data);
        } else {
          console.error('Failed to fetch user data:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch Fivetran connections
  useEffect(() => {
    const fetchFivetranConnections = async () => {
      try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/fivetran/connections/`);
        if (response.ok) {
          const data = await response.json();
          setFivetranConnections(data.connectors || []);
          console.log('Fivetran connections loaded:', data.connectors);
        } else {
          console.error('Failed to fetch Fivetran connections:', response.status);
        }
      } catch (error) {
        console.error('Error fetching Fivetran connections:', error);
      }
    };

    fetchFivetranConnections();
  }, [authFetch]);

  // Check if user has connected Shopify based on user data
  const hasConnectedShopify = useMemo(() => {
    if (userDataLoading) {
      // Fallback to stored data while loading
      return !!(storedData?.user?.store_shopify_domain || storedData?.connectionStatus?.is_connected);
    }
    
    // Use user data if available, otherwise fallback to stored data
    if (userData) {
      return !!(userData.store_shopify_domain);
    }
    
    return !!(storedData?.user?.store_shopify_domain || storedData?.connectionStatus?.is_connected);
  }, [userDataLoading, userData, storedData?.user?.store_shopify_domain, storedData?.connectionStatus?.is_connected]);

  // Check if user has run audit based on user data
  const hasRunAudit = useMemo(() => {
    if (userDataLoading) {
      // Fallback to stored data while loading
      const hasSchedules = !!(storedData?.schedules && storedData.schedules.length > 0);
      const hasAlerts = !!(storedData?.alerts && storedData.alerts.length > 0);
      return hasSchedules || hasAlerts;
    }
    
    // Use user data if available
    if (userData) {
      return userData.store_audit_sent;
    }
    
    // Fallback to stored data
    const hasSchedules = !!(storedData?.schedules && storedData.schedules.length > 0);
    const hasAlerts = !!(storedData?.alerts && storedData.alerts.length > 0);
    return hasSchedules || hasAlerts;
  }, [userDataLoading, userData, storedData?.schedules, storedData?.alerts]);

  // Show onboarding buttons logic - only for empty chats
  const showOnboardingButtons = useMemo(() => {
    // Don't show anything while loading
    if (userDataLoading) return false;
    
    // Only show for completely empty chats (no messages at all)
    if (messages.length > 0) return false;
    
    // Show if user hasn't connected Shopify (and not dismissed) OR hasn't run audit (and not dismissed)
    const showShopifyConnect = !hasConnectedShopify && !dismissedShopify;
    const showAuditButton = hasConnectedShopify && !hasRunAudit && !dismissedAudit;
    
    return showShopifyConnect || showAuditButton;
  }, [userDataLoading, messages.length, hasConnectedShopify, hasRunAudit, dismissedShopify, dismissedAudit]);

  // Check if we have user messages to determine layout
  const hasUserMessages = useMemo(() => {
    return messages.some(m => m.role === 'user');
  }, [messages]);

  // Dismiss handlers
  const handleDismissShopify = useCallback(() => {
    setDismissedShopify(true);
    localStorage.setItem('dismissed_shopify_connect', 'true');
  }, []);

  const handleDismissAudit = useCallback(() => {
    setDismissedAudit(true);
    localStorage.setItem('dismissed_store_audit', 'true');
  }, []);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isLoading) return;
    
    const messageToSend = message.trim();
    setMessage('');
    sendMessage(messageToSend, currentThreadId);
  }, [message, isLoading, sendMessage, currentThreadId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleThreadSelect = useCallback((threadId: string) => {
    setCurrentThreadId(threadId || undefined);
  }, []);

  const handleAgentCreate = useCallback((specification: AgentSpecification) => {
    createAgent(specification);
    closeAgentDrawer();
  }, [createAgent, closeAgentDrawer]);

  const handleAgentDrawerClose = useCallback(() => {
    closeAgentDrawer();
  }, [closeAgentDrawer]);

  const handleAgentTypeClick = useCallback((agentName: string) => {
    const agentMessage = `Create a ${agentName} agent`;
    setMode('agent_builder');
    sendMessage(agentMessage, currentThreadId, 'agent_builder');
  }, [setMode, sendMessage, currentThreadId]);

  const handleShopifyConnect = useCallback(async () => {
    setIsConnectingShopify(true);
    setShopifyError('');
    
    try {
      // Redirect to Shopify OAuth
      const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/shopify/auth`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Shopify connection error:', error);
      setShopifyError(error instanceof Error ? error.message : 'Failed to connect to Shopify');
      setShowShopifyErrorModal(true);
    } finally {
      setIsConnectingShopify(false);
    }
  }, []);

  const handleTriggerAudit = useCallback(async () => {
    setIsGeneratingAudit(true);
    
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/trigger-store-audit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate store audit');
      }

      const result = await response.json();
      
      // Update user data to reflect audit was sent
      if (userData) {
        setUserData({ ...userData, store_audit_sent: true });
      }
      
      // Show success message
      console.log('Store audit triggered:', result);
      alert(`Store audit generation started! The report will be emailed to ${result.user_email || userData?.contact_email || 'you'}.`);
      
    } catch (error) {
      console.error('Audit generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate store audit. Please try again.');
    } finally {
      setIsGeneratingAudit(false);
    }
  }, [authFetch, userData]);

  // Memoized computations
  const intentLocked = useMemo(() => 
    messages.some((m) => m.role === 'user'), 
    [messages]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const userName = useMemo(() => {
    // Prefer userData over storedData
    if (userData?.first_name) {
      return userData.first_name;
    }
    return storedData?.user?.first_name || '';
  }, [userData?.first_name, storedData?.user?.first_name]);

  // Build connections for integrations display
  const connections = useMemo(() => {
    const connectedServices: Connection[] = [];
    
    // Map Fivetran connections to Connection interface
    fivetranConnections.forEach((fivetranConn) => {
      const serviceInfo = AVAILABLE_SERVICES.find(s => s.id === fivetranConn.service);
      if (serviceInfo) {
        connectedServices.push({
          id: fivetranConn.fivetran_connector_id,
          name: serviceInfo.name,
          iconUrl: serviceInfo.icon,
          enabled: ['ACTIVE', 'SUCCEEDED'].includes(fivetranConn.status?.toUpperCase() || '')
        });
      }
    });
    
    return connectedServices;
  }, [fivetranConnections]);

  // Utility function to parse thread's last message for display (using same logic as messages)
  const parseThreadLastMessage = useCallback((lastMessage: string | null | undefined): string => {
    if (!lastMessage) return '';
    
    // Use the same parsing logic as messages
    try {
      // Clean up the string - remove leading/trailing whitespace and newlines
      let content = lastMessage.trim();
      
      // Handle double-escaped JSON (from database storage)
      if (content.startsWith('"{') && content.endsWith('}"')) {
        content = JSON.parse(content);
      }
      
      // Check if it starts with { and try to find the first complete JSON object
      if (content.startsWith('{')) {
        // If there are multiple JSON objects concatenated, try to extract the first one
        let braceCount = 0;
        let firstJsonEnd = -1;
        
        for (let i = 0; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          else if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              firstJsonEnd = i;
              break;
            }
          }
        }
        
        if (firstJsonEnd > -1) {
          const firstJsonStr = content.substring(0, firstJsonEnd + 1);
          const parsedResponse = JSON.parse(firstJsonStr);
          
          if (parsedResponse.message && typeof parsedResponse.message === 'string') {
            return parsedResponse.message;
          }
        }
      }
    } catch (error) {
      // If parsing fails, return the original message
    }
    
    // If parsing fails or no JSON found, return original content
    return lastMessage;
  }, []);

  // Listen for a custom event to reset chat from anywhere (e.g., sidebar)
  useEffect(() => {
    const handler = () => {
      resetChat();
      setCurrentThreadId(undefined);
      setMessage('');
    };
    window.addEventListener('thinkr:new-chat', handler);
    return () => window.removeEventListener('thinkr:new-chat', handler);
  }, [resetChat]);

  // Compute filtered threads for search
  const filteredThreads = threads.filter(thread => {
    const cleanedMessage = parseThreadLastMessage(thread.last_message);
    const displayText = thread.display_name ||
      (cleanedMessage.length > 30 ? cleanedMessage.slice(0, 30) + '...' : cleanedMessage) ||
      'Untitled Chat';
    const search = chatSearch.toLowerCase();
    return (
      displayText.toLowerCase().includes(search) ||
      (cleanedMessage && cleanedMessage.toLowerCase().includes(search))
    );
  });

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col items-center justify-between bg-[#111314] overflow-hidden">
        {/* Centered main content: greeting and agent cards */}
        <div className="flex flex-col items-center justify-center w-full" style={{ flex: '1 0 auto' }}>
          <h1 className="text-white text-3xl font-normal text-center w-[77%] max-w-4xl mb-8">
            {greeting},{userName ? ` ${userName}` : ''}
          </h1>
          {mode === 'agent_builder' && (
            <div className="w-[77%] max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#181A1B] rounded-2xl p-4 border border-[#232425]">
              {AGENT_TYPES.map((agent) => (
                <button
                  key={agent.name}
                  onClick={() => handleAgentTypeClick(agent.name)}
                  className="flex flex-col items-center justify-center bg-[#232425] hover:bg-[#2C2D32] rounded-lg p-3 transition-colors border border-[#232425] hover:border-[#7B6EF6] shadow group focus:outline-none min-h-[110px]"
                >
                  <span className="mb-2 text-white group-hover:text-[#7B6EF6]">
                    {React.cloneElement(agent.icon as React.ReactElement, { className: 'w-5 h-5' })}
                  </span>
                  <span className="text-[13px] font-semibold text-white mb-0.5 text-center leading-tight">{agent.name}</span>
                  <span className="text-[11px] text-gray-400 text-center leading-tight">{agent.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat input area - always at the bottom, centered */}
        <div className="w-full flex justify-center mb-6" style={{ flex: '0 0 auto' }}>
          <div className="bg-chat-dark rounded-2xl px-6 pt-4 pb-6 border border-chat-border shadow-[0_-2px_8px_0_rgba(0,0,0,0.15)] w-[77%] max-w-4xl flex flex-col gap-2" style={{ boxSizing: 'border-box' }}>
            <div className="bg-chat-input rounded-2xl p-4 flex items-center">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Create an Agent or ask anything..."
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent text-chat-text placeholder-chat-icon resize-none focus:outline-none text-base"
                style={{ minHeight: '24px' }}
              />
            </div>
            <div className="flex items-center w-full mt-2">
              <SegmentedModeSelector
                mode={mode}
                onChange={setMode}
                disabled={isLoading || intentLocked}
                connections={connections}
                hasShopifyConnection={hasConnectedShopify}
                className="w-full"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className={`w-10 h-10 ml-4 text-chat-text rounded-lg flex items-center justify-center transition-colors shadow-none border-none ${
                  !message.trim() || isLoading 
                    ? 'bg-enter-inactive opacity-50 cursor-not-allowed' 
                    : 'bg-enter-active hover:bg-purple-400'
                }`}
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Agent Preview Drawer */}
        <AgentPreviewDrawer
          isOpen={agentDrawerOpen}
          onClose={handleAgentDrawerClose}
          specification={currentAgentSpec}
          description="This agent will help monitor your store's performance automatically."
          onConfirm={handleAgentCreate}
          loading={createAgentLoading}
        />

        {/* Shopify Error Modal */}
        <ShopifyErrorModal
          isOpen={showShopifyErrorModal}
          onClose={() => setShowShopifyErrorModal(false)}
          error={shopifyError}
          userEmail={userData?.contact_email || storedData?.user?.email}
        />
      </div>
    </ErrorBoundary>
  );
}

export default function ChatPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatShell />
    </QueryClientProvider>
  );
}