'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Plus, Settings, ArrowUp } from 'lucide-react';
import Link from 'next/link';

import SegmentedModeSelector from '@/components/SegmentedModeSelector';
import MessageList from '@/components/MessageList';
import SimpleThreadList from '@/components/SimpleThreadList';
import AgentPreviewDrawer from '@/components/AgentPreviewDrawer';
import { useChat, useChatUI } from '@/hooks/useChat';
import { ChatIntent, AgentSpecification } from '@/types/chat';

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
    openAgentDrawer,
    closeAgentDrawer,
  } = useChatUI();

  const {
    messages,
    threads,
    error,
    isLoading,
    threadsLoading,
    sendMessage,
    createAgent,
    clearError,
    refetchThreads,
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
    setCurrentThreadId(threadId);
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
    { icon: '📈', name: 'Growth Strategist', desc: 'Monitor revenue and growth metrics' },
    { icon: '📊', name: 'Performance Manager', desc: 'Track key performance indicators' },
    { icon: '📋', name: 'Data Analyst', desc: 'Generate automated reports' },
    { icon: '🎯', name: 'Sales Agent', desc: 'Track sales and conversions' },
  ];

  return (
    <div className="flex h-screen bg-[#141718]">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#1A1C1D] border-r border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
              <span className="text-black font-bold text-sm">T</span>
            </div>
            <span className="text-white font-semibold text-lg">thinkr</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-6">
          <button
            onClick={() => setCurrentThreadId(undefined)}
            className="w-full flex items-center gap-3 px-4 py-3 text-purple-400 hover:text-white hover:bg-[#2A2D2E] rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">New chat</span>
          </button>
        </div>

        {/* Recent Conversations */}
        <div className="flex-1 px-4">
          <SimpleThreadList
            threads={threads}
            currentThreadId={currentThreadId}
            onSelect={handleThreadSelect}
            loading={threadsLoading}
          />
        </div>

        {/* Navigation */}
        <nav className="px-4 mb-4">
          <div className="space-y-1">
            <Link href="/app/actions" className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-[#2A2D2E] rounded-lg transition-colors text-sm">
              <div className="w-4 h-4 rounded-full border border-gray-500"></div>
              <span>Agents</span>
            </Link>
          </div>
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-gray-700">
          <Link href="/app/profile" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-[#2A2D2E] rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col justify-center items-center p-8">
          {/* Centered Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
                <span className="text-black font-bold">T</span>
              </div>
              <span className="text-white font-semibold text-xl">thinkr</span>
            </div>
          </div>

          {/* Chat Content */}
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
                  Good evening, Edu
                </h1>
              </div>
            )}

            {/* Input Area */}
            <div className="bg-[#2A2D2E] rounded-2xl p-4 mb-4">
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

            {/* Mode Selector and Actions */}
            <div className="flex items-center justify-between mb-6">
              <SegmentedModeSelector
                mode={mode}
                onChange={setMode}
                disabled={isLoading}
              />
              
              <div className="flex items-center gap-3">
                <Link href="/app/integrations">
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A2D2E] rounded-lg transition-colors">
                    <Settings className="h-4 w-4" />
                    <span>Integrations</span>
                  </button>
                </Link>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="w-10 h-10 bg-[#7B6EF6] hover:bg-[#6A5ACD] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              </div>
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
                    <div className="text-2xl mb-2">{agentType.icon}</div>
                    <div className="text-white font-medium text-sm mb-1">{agentType.name}</div>
                    <div className="text-gray-400 text-xs">{agentType.desc}</div>
                  </button>
                ))}
              </div>
            )}
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