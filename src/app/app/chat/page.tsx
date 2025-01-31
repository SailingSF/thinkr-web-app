'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Thread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
}

const MAX_POLLING_ATTEMPTS = 30; // 30 seconds max wait time

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (currentThreadId) {
      loadChatHistory(currentThreadId);
    } else {
      // Clear messages when starting a new chat
      setMessages([]);
    }
  }, [currentThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendChatMessage(message: string, threadId?: string) {
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ message, thread_id: threadId })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { task_id } = await response.json();
      
      // Add user message immediately
      setMessages(prev => [...prev, {
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      }]);
      
      // Poll for result with timeout
      let attempts = 0;
      while (attempts < MAX_POLLING_ATTEMPTS) {
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/status/?task_id=${task_id}`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to check message status');
        }

        const result = await statusResponse.json();
        
        if (result.status === 'completed') {
          // Add assistant message
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.response,
            created_at: new Date().toISOString()
          }]);
          
          // After getting a successful response, load the updated threads
          // This will ensure we have the latest thread information
          await loadThreads();
          
          // If this was a new conversation, get the latest thread and set it as current
          if (!threadId) {
            const threadsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/threads/`, {
              headers: { 'Authorization': `Token ${token}` }
            });
            
            if (threadsResponse.ok) {
              const { threads: latestThreads } = await threadsResponse.json();
              if (latestThreads.length > 0) {
                // Set the most recent thread as current
                setCurrentThreadId(latestThreads[0].thread_id);
              }
            }
          }
          
          return result;
        } else if (result.status === 'error') {
          throw new Error(result.error || 'Error processing message');
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw new Error('Response timeout - please try again');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  }
  
  async function loadChatHistory(threadId: string) {
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/history/?thread_id=${threadId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat history';
      setError(errorMessage);
      console.error('Error loading chat history:', error);
    }
  }
  
  async function loadThreads() {
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/threads/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load chat threads');
      }

      const data = await response.json();
      setThreads(data.threads);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat threads';
      setError(errorMessage);
      console.error('Error loading threads:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await sendChatMessage(message, currentThreadId);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-8 pb-4">
        <h1 className="text-2xl font-semibold text-white">Chat Assistant</h1>
        <p className="text-gray-400 mt-1">Discuss your Shopify store data and get AI assistance.</p>
      </div>

      <div className="flex flex-1 gap-6 px-8 pb-8 h-[calc(100vh-12rem)] overflow-hidden">
        {/* Thread List */}
        <div className="w-72 flex flex-col bg-[#1E1F20] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#232627]">
            <button
              onClick={() => setCurrentThreadId(undefined)}
              className="w-full py-2.5 px-4 rounded-lg bg-[#7B6EF6] hover:bg-[#7B6EF6]/90 text-white font-medium transition-colors"
            >
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.thread_id}
                className={`w-full text-left p-4 border-b border-[#232627] transition-colors ${
                  currentThreadId === thread.thread_id 
                    ? 'bg-[#232627] text-white' 
                    : 'text-gray-400 hover:bg-[#232627] hover:text-white'
                }`}
                onClick={() => setCurrentThreadId(thread.thread_id)}
              >
                <div className="font-medium truncate">
                  {thread.last_message || 'New Thread'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(thread.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#1E1F20] rounded-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-6 flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#7B6EF6] text-white'
                        : 'bg-[#232627] text-gray-200'
                    } prose prose-invert max-w-none`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-none p-4 border-t border-[#232627]">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-[#232627] text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7B6EF6]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg bg-[#7B6EF6] hover:bg-[#7B6EF6]/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}