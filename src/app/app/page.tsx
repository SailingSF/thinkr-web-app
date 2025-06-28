'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Plus, ArrowUp } from 'lucide-react';
import Image from 'next/image';

import SegmentedModeSelector from '@/components/SegmentedModeSelector';
import MessageList from '@/components/MessageList';
import AgentPreviewDrawer from '@/components/AgentPreviewDrawer';
import { useChat, useChatUI } from '@/hooks/useChat';
import { ChatIntent, AgentSpecification } from '@/types/chat';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function ChatShell() {
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [message, setMessage] = useState('');
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
  } = useChat({ 
    threadId: currentThreadId, 
    intent: mode,
    onThreadChange: setCurrentThreadId
  });

  // Agent specifications are now displayed inline in chat messages
  // No need to auto-open drawer since confirmation is done via chat text responses

  const handleSendMessage = () => {
    if (!message.trim() || isLoading) return;
    
    const messageToSend = message.trim();
    setMessage('');
    sendMessage(messageToSend, currentThreadId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId || undefined);
  };

  const handleAgentCreate = (specification: AgentSpecification) => {
    createAgent(specification);
    closeAgentDrawer();
  };

  const handleAgentDrawerClose = () => {
    closeAgentDrawer();
  };

  const handleAgentTypeClick = (agentName: string) => {
    const agentMessage = `Create a ${agentName} agent`;
    setMode('agent_builder');
    sendMessage(agentMessage, currentThreadId);
  };

  // Agent type suggestions
  const agentTypes = [
    { 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M9 12h.01M9 15h.01M15 9h.01M15 12h.01M15 15h.01" />
        </svg>
      ), 
      name: 'Inventory', 
      desc: 'Track and optimize inventory levels' 
    },
    { 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ), 
      name: 'Price Optimization', 
      desc: 'Optimize pricing strategies' 
    },
    { 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      name: 'Financial Metrics', 
      desc: 'Monitor financial performance' 
    },
    { 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ), 
      name: 'General Insights', 
      desc: 'Get comprehensive business insights' 
    },
    { 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      name: 'Top Customers', 
      desc: 'Analyze customer behavior and value' 
    },
    { 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ), 
      name: 'Revenue', 
      desc: 'Track revenue trends and growth' 
    },
  ];

  // Determine if the user has already sent a message in this thread
  const intentLocked = messages.some((m) => m.role === 'user');

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Pull user first name from localStorage cache if available
  const { storedData } = useLocalStorage();
  const userName = storedData?.user?.first_name || '';

  return (
    <div className="flex flex-col h-full">
      {/* Top-left controls: History & New chat (flipped order) */}
      <div className="absolute top-4 left-4 lg:left-[280px] flex items-center gap-3 z-30">
        <select
          className="bg-[#2A2D2E] text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
          value={currentThreadId || ''}
          onChange={(e) => handleThreadSelect(e.target.value)}
        >
          <option value="">Chat History</option>
          {threads.map((thread) => (
            <option key={thread.thread_id} value={thread.thread_id}>
              {thread.display_name || thread.last_message?.slice(0, 30) || 'Conversation'}
            </option>
          ))}
        </select>

        <button
          onClick={() => setCurrentThreadId(undefined)}
          className="flex items-center gap-2 px-3 py-2 bg-[#2A2D2E] hover:bg-[#3A3D3E] text-purple-400 rounded-lg text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-16">
        {/* Centered Logo */}
        <div className="mb-12">
          <Image
            src="/thinkr-logo-white.png"
            alt="thinkr logo"
            width={320}
            height={96}
            priority
            className="w-auto h-24"
          />
        </div>

        {/* Content container with max width */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Messages */}
          {messages.length > 1 ? (
            <div className="mb-8">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                error={error}
                onErrorDismiss={clearError}
                className="max-h-96 overflow-y-auto"
              />
            </div>
          ) : (
            <div className="mb-8">
              <h1 className="text-white text-2xl font-normal mb-6 text-center">
                {greeting}{userName ? `, ${userName}` : ''}
              </h1>
            </div>
          )}

          {/* Input area & actions - wider input */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-[#2A2D2E] rounded-2xl p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="I want to monitor growth of my store"
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none text-lg"
                style={{ minHeight: '24px' }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="w-10 h-10 bg-[#7B6EF6] hover:bg-[#6A5ACD] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>

          {/* Mode selector underneath input */}
          <div className="flex justify-center mb-8">
            <SegmentedModeSelector
              mode={mode}
              onChange={setMode}
              disabled={isLoading || intentLocked}
            />
          </div>

          {/* Agent Type Suggestions (only show for Agents mode and new chat) */}
          {mode === 'agent_builder' && messages.length <= 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {agentTypes.map((agentType, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAgentTypeClick(agentType.name)}
                  className="p-4 bg-[#2A2D2E] hover:bg-[#3A3D3E] rounded-xl transition-colors text-center"
                >
                  <div className="text-white mb-3 flex justify-center">{agentType.icon}</div>
                  <div className="text-white font-medium text-sm mb-1">{agentType.name}</div>
                  <div className="text-gray-400 text-xs">{agentType.desc}</div>
                </button>
              ))}
            </div>
          )}
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
    </div>
  );
}

export default function ChatPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatShell />
    </QueryClientProvider>
  );
}