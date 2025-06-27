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
      
      console.log('Parsing response format:', {
        responseType: typeof result.response,
        response: result.response,
        hasAgentSpec: !!result.agent_specification
      });

      if (typeof result.response === 'object' && result.response !== null) {
        // New format: response is an object with message and possibly agent_specification
        // But check if the message is itself a JSON string that needs parsing
        const responseMessage = result.response.message;
        
        if (typeof responseMessage === 'string') {
          const { messageContent: parsed, agentSpec: parsedSpec } = parseMessageContent(responseMessage);
          messageContent = parsed;
          agentSpec = parsedSpec || result.response.agent_specification || result.agent_specification;
        } else {
          // Regular object response
          messageContent = responseMessage;
          agentSpec = result.response.agent_specification || result.agent_specification;
        }
      } else if (typeof result.response === 'string') {
        // String response - try to parse it
        const { messageContent: parsed, agentSpec: parsedSpec } = parseMessageContent(result.response);
        messageContent = parsed;
        agentSpec = parsedSpec || result.agent_specification;
      } else {
        // Fallback for any other format
        messageContent = String(result.response) || '';
        agentSpec = result.agent_specification;
      }

      console.log('Processing chat response:', { 
        rawResult: result,
        messageContent, 
        agentSpec, 
        thread_id: result.thread_id 
      });
      
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
      
      // Process the message to parse any raw JSON content
      const processedMessage = processMessage(assistantMessage);
      setMessages(prev => [...prev, processedMessage]);
      
      // Store the latest agent spec for potential drawer use (though we're not using the drawer now)
      if (processedMessage.agent_specification) {
        setLatestAgentSpec(processedMessage.agent_specification);
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
    if (historyData && historyData.length > 0) {
      // Process historical messages to parse any raw JSON content
      const processedMessages = historyData.map(processMessage);
      
      // Only update messages if we don't already have messages for this thread
      // or if the historical messages are different from current messages
      setMessages(prevMessages => {
        // If we have no messages or it's a different thread, use history data
        if (prevMessages.length === 0 || prevMessages.length === 1 && prevMessages[0].id === 'welcome') {
          return processedMessages;
        }
        
        // If we already have messages and they're more recent than history, keep current messages
        // This prevents overwriting newly added messages when history refetches
        const lastHistoryMessage = processedMessages[processedMessages.length - 1];
        const lastCurrentMessage = prevMessages[prevMessages.length - 1];
        
        if (lastCurrentMessage && lastHistoryMessage) {
          const currentTime = new Date(lastCurrentMessage.created_at).getTime();
          const historyTime = new Date(lastHistoryMessage.created_at).getTime();
          
          // If current messages are newer or same, keep them
          if (currentTime >= historyTime) {
            console.log('Keeping current messages as they are newer than history');
            return prevMessages;
          }
        }
        
        // Otherwise use the processed history data
        return processedMessages;
      });
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

// Helper function to parse message content and extract agent specifications
function parseMessageContent(content: string): { messageContent: string; agentSpec?: AgentSpecification } {
  console.log('parseMessageContent called with:', content);
  
  if (!content || typeof content !== 'string') {
    return { messageContent: content || '' };
  }

  try {
    // Clean up the string - remove leading/trailing whitespace and newlines
    const trimmedContent = content.trim();
    
    // Check if it starts with { and try to find the first complete JSON object
    if (trimmedContent.startsWith('{')) {
      console.log('Content starts with {, attempting to parse as JSON');
      
      // If there are multiple JSON objects concatenated, try to extract the first one
      let braceCount = 0;
      let firstJsonEnd = -1;
      
      for (let i = 0; i < trimmedContent.length; i++) {
        if (trimmedContent[i] === '{') braceCount++;
        else if (trimmedContent[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            firstJsonEnd = i;
            break;
          }
        }
      }
      
      if (firstJsonEnd > -1) {
        const firstJsonStr = trimmedContent.substring(0, firstJsonEnd + 1);
        console.log('Extracted JSON string:', firstJsonStr);
        
        const parsedResponse = JSON.parse(firstJsonStr);
        
        if (parsedResponse.message && typeof parsedResponse.message === 'string') {
          console.log('Successfully parsed JSON with message and agent_specification:', {
            message: parsedResponse.message,
            agentSpec: parsedResponse.agent_specification
          });
          
          return {
            messageContent: parsedResponse.message,
            agentSpec: parsedResponse.agent_specification
          };
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse message content as JSON:', error);
  }

  // If parsing fails or no JSON found, return original content
  console.log('Returning original content');
  return { messageContent: content };
}

// Helper function to process and clean up messages from backend
function processMessage(message: ChatMessage): ChatMessage {
  if (message.role === 'assistant') {
    // Check for agent specification in metadata (historical messages)
    const metadataAgentSpec = message.metadata?.agent_specification;
    
    if (metadataAgentSpec) {
      console.log('Found agent specification in metadata:', metadataAgentSpec);
      return {
        ...message,
        agent_specification: metadataAgentSpec
      };
    }
    
    // If no metadata agent spec, try to parse from content (new messages with JSON)
    if (message.content) {
      const { messageContent, agentSpec } = parseMessageContent(message.content);
      
      return {
        ...message,
        content: messageContent,
        agent_specification: agentSpec || message.agent_specification
      };
    }
  }
  
  return message;
}