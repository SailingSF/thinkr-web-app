import {
  SendMessageRequest,
  ChatResponse,
  ChatStatusResponse,
  ThreadsResponse,
  ChatHistoryResponse,
  AgentSpecification,
} from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Only access localStorage on the client side
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  
  return headers;
}

export async function sendMessage(request: SendMessageRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/message/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to send message');
  }

  return response.json();
}

export async function getChatStatus(taskId: string): Promise<ChatStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/status/?task_id=${taskId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to check message status');
  }

  return response.json();
}

export async function listThreads(): Promise<ThreadsResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/threads/`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to load threads');
  }

  return response.json();
}

export async function getChatHistory(threadId: string): Promise<ChatHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/history/?thread_id=${threadId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to load chat history');
  }

  return response.json();
}

// Agent CRUD operations
export async function createAgent(specification: AgentSpecification): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agents/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(specification),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to create agent');
  }
}

export async function updateAgent(agentId: string, specification: AgentSpecification): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agents/${agentId}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(specification),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to update agent');
  }
}

export async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agents/${agentId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to delete agent');
  }
}

// Utility function to poll chat status with exponential backoff
export async function pollChatStatus(
  taskId: string,
  maxAttempts: number = 30,
  initialDelay: number = 1000
): Promise<ChatStatusResponse> {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    const result = await getChatStatus(taskId);
    
    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
    delay = Math.min(delay * 1.5, 5000); // Exponential backoff capped at 5s
  }
  
  throw new Error('Response timeout - please try again');
}

// Utility function to generate thread title from first message or last message
export function generateThreadTitle(displayName?: string, lastMessage?: string | null): string {
  if (displayName) return displayName;
  
  if (lastMessage) {
    // Take first 4-6 words, max 40 characters
    const words = lastMessage.trim().split(/\s+/);
    const firstWords = words.slice(0, 5).join(' ');
    if (firstWords.length > 40) {
      return firstWords.substring(0, 37) + '...';
    }
    return firstWords;
  }
  
  return 'New conversation';
}

// Utility function to convert cron expression to human-readable format
export function cronToSentence(cron: string): string {
  // Basic implementation - can be enhanced with a proper cron parser
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Simple patterns
  if (cron === '0 9 * * 1') return 'Every Monday at 09:00 UTC';
  if (cron === '0 9 * * *') return 'Every day at 09:00 UTC';
  if (cron === '0 9 * * 0') return 'Every Sunday at 09:00 UTC';
  
  return `${hour}:${minute.padStart(2, '0')} UTC`;
}