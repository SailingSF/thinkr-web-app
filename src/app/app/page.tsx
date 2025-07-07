'use client';

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
  const { setShowLogo, isSidebarCollapsed } = useNavigation();
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

  // Handle pre-filled agent prompt from template
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefillPrompt = localStorage.getItem('prefill_agent_prompt');
      const prefillIntent = localStorage.getItem('prefill_agent_intent');
      
      if (prefillPrompt && prefillIntent) {
        // Set the message and mode
        setMessage(prefillPrompt);
        setMode(prefillIntent as ChatIntent);
        
        // Clear the localStorage items
        localStorage.removeItem('prefill_agent_prompt');
        localStorage.removeItem('prefill_agent_intent');
      }
    }
  }, [setMode]);

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

  const handleAgentCardClick = useCallback((agentName: string) => {
    const agentMessage = `Create a ${agentName} agent`;
    sendMessage(agentMessage, currentThreadId, 'agent_builder');
  }, [sendMessage, currentThreadId]);

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
      <div className="flex flex-col h-full">
        {/* Top controls - positioned differently based on active chat */}
        <div className={`absolute top-4 left-4 lg:left-4 flex items-center gap-3 z-30 ${hasUserMessages ? 'opacity-90' : ''} ml-16 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 bg-[#2A2D2E] hover:bg-[#3A3D3E] text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none transition-colors border border-gray-600/30 hover:border-purple-400/50 min-w-[180px] shadow-sm"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              type="button"
            >
              <span className="truncate flex-1 text-left">
                {currentThreadId
                  ? (threads.find(t => t.thread_id === currentThreadId)?.display_name || 'Recents')
                  : 'Chat History'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-[260px] max-h-[80vh] bg-[#232425] border border-[#3A3D3E] rounded-lg shadow-lg z-50 overflow-y-auto animate-fade-in">
                <div className="py-2">
                  {/* Search bar replaces the second 'Chat History' label */}
                  <div className="px-4 pb-2">
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full px-3 py-2 rounded-md bg-[#181A1B] text-sm text-white placeholder-gray-400 border border-[#2A2D2E] focus:outline-none focus:border-gray-500 transition"
                    />
                  </div>
                  {/* Filtered chat list */}
                  {filteredThreads.length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">No conversations found</div>
                  )}
                  {filteredThreads.map((thread) => {
                    const cleanedMessage = parseThreadLastMessage(thread.last_message);
                    const displayText = thread.display_name ||
                      (cleanedMessage.length > 30 ? cleanedMessage.slice(0, 30) + '...' : cleanedMessage) ||
                      'Untitled Chat';
                    const isSelected = currentThreadId === thread.thread_id;
                    const type = thread.intent || 'ask';
                    const isAgent = type === 'agent_builder';
                    const typeIcon = isAgent
                      ? <Hexagon className="w-4 h-4 text-[#60A5FA]" />
                      : <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#B7A9F7]" />;
                    const typeLabel = isAgent
                      ? <span className="text-xs font-medium text-[#60A5FA]">Agent</span>
                      : <span className="text-xs font-medium text-[#B7A9F7]">Chat</span>;
                    // Format date (fallback to empty if not available)
                    const date = thread.created_at ? new Date(thread.created_at).toLocaleDateString() : '';
                    return (
                      <button
                        key={thread.thread_id}
                        className={`w-full text-left px-4 py-3 rounded-md flex flex-col gap-1 transition-colors text-sm ${isSelected ? 'bg-[#7B6EF6]/20 text-[#B7A9F7]' : 'hover:bg-[#2A2D2E] text-white'}`}
                        onClick={() => {
                          handleThreadSelect(thread.thread_id);
                          setDropdownOpen(false);
                        }}
                        tabIndex={0}
                        aria-selected={isSelected}
                      >
                        {/* Top row: icon + type label */}
                        <span className="flex items-center gap-2 mb-1">
                          {typeIcon}
                          {typeLabel}
                        </span>
                        {/* Title */}
                        <span className="font-semibold text-base truncate">{displayText}</span>
                        {/* Message */}
                        {cleanedMessage && (
                          <span className="block text-xs text-gray-400 truncate">{cleanedMessage}</span>
                        )}
                        {/* Date */}
                        {date && (
                          <span className="block text-[11px] text-gray-500 mt-1">{date}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content container - restructured layout */}
        { !hasUserMessages ? (
          // State 1: Centered layout with sections
          <div className="flex flex-col h-full w-full">
            {/* Section 1: Greeting */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="bg-[#181A1B] rounded-2xl shadow border border-[#232425] w-full max-w-4xl flex flex-col px-8 pt-8 pb-8" style={{ minHeight: '320px' }}>
                {/* Thinkr Logo */}
                <div className="flex justify-center mb-8">
                  <Image
                    src="/thinkr-logo-white.png"
                    alt="Thinkr"
                    width={160}
                    height={50}
                    className="object-contain"
                  />
                </div>
                
                <h1 className="text-white text-2xl font-normal mb-6 text-center w-full">
                    {greeting},{userName ? ` ${userName}` : ''}
                  </h1>
                
                {/* Section 2: Agents (when mode is 'agent_builder') */}
                {mode === 'agent_builder' && (
                  <div className="mb-8 w-full flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-5xl">
                      {/* Inventory */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('Inventory Manager')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><rect x="2" y="2" width="14" height="14" rx="2" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">Inventory Manager</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Track and optimize inventory levels</span>
                      </div>
                      {/* Price Optimization */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('Pricing Consultant')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><path d="M9 13l-4-4h8l-4 4z" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">Pricing Consultant</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Optimize pricing strategies</span>
                      </div>
                      {/* Financial Metrics */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('Financial Analyst')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="9" cy="9" r="7" strokeWidth="2"/><path d="M9 6v3l2 2" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">Financial Analyst</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Monitor financial performance</span>
                      </div>
                      {/* General Insights */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('General Advisor')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="9" cy="9" r="7" strokeWidth="2"/><path d="M9 15h.01" strokeWidth="2"/><path d="M9 5v5" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">General Advisor</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Get comprehensive business insights</span>
                      </div>
                      {/* Top Customers */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('Customer Support')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="9" cy="6" r="3" strokeWidth="2"/><path d="M4 16v-1a5 5 0 015-5h0a5 5 0 015 5v1" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">Customer Support</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Analyze customer behavior and value</span>
                      </div>
                      {/* Revenue */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('Revenue Officer')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><path d="M2 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" strokeWidth="2"/><path d="M13 9V6a4 4 0 00-8 0v3" strokeWidth="2"/><rect x="6" y="9" width="6" height="5" rx="1" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">Revenue Officer</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Track revenue trends and growth</span>
                      </div>
                      {/* Conversion Analyst */}
                      <div className="border border-gray-700 bg-transparent px-3 py-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#7B6EF6] hover:bg-[#232425] transition-all shadow-sm min-h-[90px] h-[90px]" onClick={() => handleAgentCardClick('Conversion Analyst')}>
                        <div className="flex items-center gap-2 mb-1 w-full justify-center">
                          <span className="text-lg flex items-center justify-center"><svg width="18" height="18" fill="none" stroke="currentColor"><path d="M2 4h14l-6 7v5l-2 1v-6L2 4z" strokeWidth="2"/></svg></span>
                          <span className="font-medium text-white text-sm text-center">Conversion Analyst</span>
                        </div>
                        <span className="text-gray-400 text-xs text-center leading-tight w-full">Understand conversion metrics</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onboarding Cards for New Users (only when not in agent mode) */}
                {mode !== 'agent_builder' && showOnboardingButtons && (
                <div className="mb-8 space-y-6 w-full">
                      {/* Shopify Connection Card */}
                      {!hasConnectedShopify && !dismissedShopify && (
                        <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-lg relative">
                          <button
                            onClick={handleDismissShopify}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            title="Dismiss this suggestion"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          <div className="mb-6 lg:mb-8 pr-8">
                            <p className="text-[#8B5CF6] text-base lg:text-lg mb-2">Step 1:</p>
                            <h3 className="text-[32px] font-inter font-normal text-white">Connect your Shopify store</h3>
                            <p className="text-sm lg:text-base text-gray-400 mt-2">
                              Connect your store to start receiving AI-powered analytics and recommendations
                            </p>
                          </div>
                          <ShopifyConnectButton
                            onClick={handleShopifyConnect}
                            isLoading={isConnectingShopify}
                          />
                        </div>
                      )}
                      {/* Store Audit Card */}
                      {hasConnectedShopify && !hasRunAudit && !dismissedAudit && (
                        <div className="bg-[#2C2C2E] p-6 lg:p-8 rounded-lg relative">
                          <button
                            onClick={handleDismissAudit}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            title="Dismiss this suggestion"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          <div className="pr-8">
                            <AuditCard
                              onTriggerAudit={handleTriggerAudit}
                              isLoading={isGeneratingAudit}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                
                  {/* Loading indicator while fetching user data */}
                  {userDataLoading && (
                <div className="mb-8 text-center w-full">
                      <div className="text-gray-400">Loading your profile...</div>
                </div>
              )}
              </div>
            </div>

            {/* Section 3: Input area - Fixed at bottom */}
            <div className="w-full flex justify-center px-4 pb-8">
              <div className="bg-chat-dark rounded-2xl px-6 pt-4 pb-6 border border-chat-border shadow-[0_-2px_8px_0_rgba(0,0,0,0.15)] w-full max-w-4xl flex flex-col gap-2" style={{ boxSizing: 'border-box' }}>
                  <div className="bg-chat-input rounded-2xl p-4 flex items-center">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Create an Agent or ask anything..."
                      disabled={isLoading}
                      rows={1}
                      className="w-full h-16 bg-transparent text-chat-text placeholder-chat-icon focus:outline-none text-base overflow-y-auto whitespace-pre-wrap break-words"
                      style={{ minHeight: '64px', maxHeight: '64px', resize: 'none' }}
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
          </div>
        ) : (
          // State 2: Full height card, input fixed to bottom
          <div className={`fixed inset-0 flex flex-col items-center justify-center z-10 px-4 transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
          } lg:right-16`} style={{ pointerEvents: 'none' }}>
            <div className="bg-[#181A1B] rounded-2xl shadow border border-[#232425] w-full max-w-4xl flex flex-col h-[calc(100vh-48px)] relative" style={{ minHeight: '500px', pointerEvents: 'auto' }}>
              {/* Messages area - scrollable, fills space above input */}
              <div className="flex-1 overflow-y-auto px-8 pt-8" style={{ paddingBottom: '112px' }}>
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  error={error}
                  onErrorDismiss={clearError}
                  className="min-h-[60vh]"
                />
              </div>
              {/* Input area - fixed to bottom, always visible, never moves */}
              <div className="absolute left-0 bottom-0 w-full px-0" style={{ pointerEvents: 'auto' }}>
                <div className="bg-chat-dark rounded-b-2xl px-6 pt-4 pb-6 border border-chat-border shadow-[0_-2px_8px_0_rgba(0,0,0,0.15)] w-full flex flex-col gap-2" style={{ boxSizing: 'border-box' }}>
                  <div className="bg-chat-input rounded-2xl p-4 flex items-center">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Create an Agent or ask anything..."
                      disabled={isLoading}
                      rows={1}
                      className="w-full h-16 bg-transparent text-chat-text placeholder-chat-icon focus:outline-none text-base overflow-y-auto whitespace-pre-wrap break-words"
                      style={{ minHeight: '64px', maxHeight: '64px', resize: 'none' }}
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
            </div>
          </div>
        )}

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