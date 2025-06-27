import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sendMessage as sendMessageAPI,
  pollChatStatus,
  listThreads,
  getChatHistory,
  createAgent,
  updateAgent,
} from '@/lib/api/chat';
import {
  ChatMessage,
  Thread,
  ChatIntent,
  AgentSpecification,
  SendMessageRequest,
} from '@/types/chat';

export interface UseChatOptions {
  threadId?: string;
  intent?: ChatIntent;
  onThreadChange?: (threadId: string) => void;
}

export function useChat({ threadId, intent, onThreadChange }: UseChatOptions = {}) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [latestAgentSpec, setLatestAgentSpec] = useState<AgentSpecification | null>(null);

  // Load threads
  const {
    data: threadsData,
    isLoading: threadsLoading,
    refetch: refetchThreads,
  } = useQuery({
    queryKey: ['threads'],
    queryFn: listThreads,
    select: (data) => data.threads,
  });

  // Load chat history for current thread
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['chat-history', threadId],
    queryFn: () => getChatHistory(threadId!),
    enabled: !!threadId,
    select: (data) => data.messages,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, currentThreadId }: { message: string; currentThreadId?: string }) => {
      setError(null);
      
      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
        intent,
      };
      
      setMessages(prev => [...prev, userMessage]);

      const request: SendMessageRequest = {
        message,
        thread_id: currentThreadId || threadId, // Use the passed threadId or fallback to the hook's threadId
        intent,
      };

      const response = await sendMessageAPI(request);
      
      // Poll for completion
      const result = await pollChatStatus(response.task_id);
      
      if (result.status === 'failed') {
        throw new Error(result.error || 'Message processing failed');
      }

      // Handle both old and new response formats
      let messageContent: string;
      let agentSpec: AgentSpecification | undefined;

      if (typeof result.response === 'object' && result.response !== null) {
        // New format: response is an object with message and possibly agent_specification
        messageContent = result.response.message;
        agentSpec = result.response.agent_specification || result.agent_specification;
      } else {
        // Old format: response is a string
        messageContent = result.response as string || '';
        agentSpec = result.agent_specification;
      }

      return {
        response: messageContent,
        agent_specification: agentSpec,
        thread_id: result.thread_id,
      };
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
        agent_specification: data.agent_specification,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Store the latest agent spec for potential drawer use (though we're not using the drawer now)
      if (data.agent_specification) {
        setLatestAgentSpec(data.agent_specification);
      }
      
      // Update the current thread ID if a new thread was created
      if (data.thread_id && data.thread_id !== threadId && onThreadChange) {
        onThreadChange(data.thread_id);
      }
      
      // Refresh threads to get updated thread list
      refetchThreads();
      
      return data;
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Chat error:', error);
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      // Optionally refresh related queries
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Create agent error:', error);
    },
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: ({ agentId, specification }: { agentId: string; specification: AgentSpecification }) =>
      updateAgent(agentId, specification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Update agent error:', error);
    },
  });

  // Sync messages with history data
  useEffect(() => {
    if (historyData) {
      setMessages(historyData);
    } else if (!threadId) {
      // New chat - show welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! How can I assist you today?',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [historyData, threadId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAgentSpec = useCallback(() => {
    setLatestAgentSpec(null);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setLatestAgentSpec(null);
  }, []);

  const sendMessage = useCallback((message: string, currentThreadId?: string) => {
    sendMessageMutation.mutate({ message, currentThreadId });
  }, [sendMessageMutation]);

  return {
    // Data
    messages,
    threads: threadsData || [],
    error,
    latestAgentSpec,
    
    // Loading states
    isLoading: sendMessageMutation.isPending,
    threadsLoading,
    historyLoading,
    
    // Actions
    sendMessage,
    createAgent: createAgentMutation.mutate,
    updateAgent: updateAgentMutation.mutate,
    clearError,
    clearAgentSpec,
    resetChat,
    refetchThreads,
    refetchHistory,
    
    // Mutation states
    createAgentLoading: createAgentMutation.isPending,
    updateAgentLoading: updateAgentMutation.isPending,
  };
}

// Hook for managing UI state (drawer open, mode selection, etc.)
export function useChatUI() {
  const [mode, setMode] = useState<ChatIntent>('ask');
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [threadDrawerOpen, setThreadDrawerOpen] = useState(false);
  const [currentAgentSpec, setCurrentAgentSpec] = useState<AgentSpecification | null>(null);

  const openAgentDrawer = useCallback((spec: AgentSpecification) => {
    setCurrentAgentSpec(spec);
    setAgentDrawerOpen(true);
  }, []);

  const closeAgentDrawer = useCallback(() => {
    setAgentDrawerOpen(false);
    setCurrentAgentSpec(null);
  }, []);

  const toggleThreadDrawer = useCallback(() => {
    setThreadDrawerOpen(prev => !prev);
  }, []);

  return {
    mode,
    setMode,
    agentDrawerOpen,
    threadDrawerOpen,
    currentAgentSpec,
    openAgentDrawer,
    closeAgentDrawer,
    toggleThreadDrawer,
    setThreadDrawerOpen,
  };
}