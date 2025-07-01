'use client';

import { useState, useCallback, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Plus, ArrowUp } from 'lucide-react';
import Image from 'next/image';

import SegmentedModeSelector from '@/components/SegmentedModeSelector';
import MessageList from '@/components/MessageList';
import AgentPreviewDrawer from '@/components/AgentPreviewDrawer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useChat, useChatUI } from '@/hooks/useChat';
import { ChatIntent, AgentSpecification } from '@/types/chat';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AGENT_TYPES } from '@/components/icons/AgentIcons';
import queryClient from '@/lib/queryClient';

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

  // Memoized event handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isLoading) return;
    
    const messageToSend = message.trim();
    setMessage('');
    sendMessage(messageToSend, currentThreadId);
  }, [message, isLoading, sendMessage, currentThreadId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
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
    sendMessage(agentMessage, currentThreadId);
  }, [setMode, sendMessage, currentThreadId]);

  // Memoized computations
  const intentLocked = useMemo(() => 
    messages.some((m) => m.role === 'user'), 
    [messages]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const { storedData } = useLocalStorage();
  const userName = useMemo(() => 
    storedData?.user?.first_name || '', 
    [storedData?.user?.first_name]
  );

  return (
    <ErrorBoundary>
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
                {AGENT_TYPES.map((agentType) => (
                  <button
                    key={agentType.name}
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