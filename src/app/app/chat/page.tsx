'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

import ConnectionsBar, { Connection } from './ConnectionsBar';
import ThreadSelector from './ThreadSelector';

// Interfaces for Fivetran data and service mapping
interface FivetranConnection {
  id: number; // or string, depending on actual API response, though not directly used for Connection mapping
  fivetran_connector_id: string;
  service: string; // e.g., 'google_ads', 'facebook_ads'
  status: string;  // e.g., 'ACTIVE', 'INCOMPLETE'
  // Add other fields if necessary for logic, though not directly mapped to Connection interface
}

interface AvailableService {
  id: string;      // Matches FivetranConnection.service
  name: string;    // Display name for the service
  icon?: string;   // Path to the icon
  // description?: string; // Not needed for ConnectionsBar
}

// Hardcoded list based on Django ALLOWED_FIVETRAN_SERVICES and used in integrations/advanced/page.tsx
// This should ideally be fetched or come from a shared utility if it grows complex or changes often.
const AVAILABLE_SERVICES: AvailableService[] = [
  { id: 'shopify', name: 'Shopify', icon: '/shopify-icon-64.png' }, // Placeholder icon, update if available
  { id: 'google_ads', name: 'Google Ads', icon: '/google-ads-icon-2.png' },
  { id: 'facebook_ads', name: 'Meta Ads', icon: '/meta-icon-2.png' },
  { id: 'google_analytics_4', name: 'Google Analytics', icon: '/google-analytics-icon.png' },
  { id: 'klaviyo', name: 'Klaviyo', icon: '/klaviyo-white-icon.png' },
  { id: 'gorgias', name: 'Gorgias', icon: '/gorgias-icon.png' },
  { id: 'pinterest_ads', name: 'Pinterest Ads', icon: '/pinterest-icon.png' },
  // Add other services as they become available and are relevant for the chat connections bar
];

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
  display_name?: string;
}

const MAX_POLLING_ATTEMPTS = 30;

const EXAMPLE_QUESTIONS = [
  'How can I improve my product descriptions?',
  'How can I segment my customers for targeted marketing?',
  'Can you recommend upsell strategies?',
  'What are my top customers?',
  'What are some SEO tips for my product pages?',
  'What are the top performing products last month?',
  'How can I use discounts effectively?',
  'How can I increase my average order value?',
  "What's the best time to send email promotions?",
];

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadThreads();
    loadConnections();
  }, []);

  useEffect(() => {
    if (currentThreadId) {
      loadChatHistory(currentThreadId);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! How can I assist you today?',
          created_at: new Date().toISOString(),
        },
      ]);
      const shuffled = [...EXAMPLE_QUESTIONS].sort(() => 0.5 - Math.random());
      setExampleQuestions(shuffled.slice(0, 3));
    }
  }, [currentThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  async function loadConnections() {
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fivetran/connections/`, { // Using /fivetran/connections/
        headers: { Authorization: `Token ${token}` },
      });
      if (response.ok) {
        const data = await response.json(); // Expected: { connectors: FivetranConnection[] }
        const fivetranConnectors: FivetranConnection[] = data.connectors || [];

        const mappedConnections: Connection[] = fivetranConnectors.map((fc) => {
          const serviceInfo = AVAILABLE_SERVICES.find(s => s.id === fc.service);
          return {
            id: fc.fivetran_connector_id || fc.service, // Use fivetran_connector_id if available, else service
            name: serviceInfo?.name || fc.service, // Use mapped name, or service id as fallback
            iconUrl: serviceInfo?.icon || '',       // Use mapped icon, or empty string
            enabled: fc.status?.toUpperCase() === 'ACTIVE' || fc.status?.toLowerCase().includes('connected'), // Determine enabled status
          };
        });
        setConnections(mappedConnections);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load connections:', response.statusText, errorData);
        // setError('Failed to load connection data.'); // Optionally set user-facing error
      }
    } catch (e) {
      console.error('Error in loadConnections:', e);
      // setError('Could not fetch connection details.'); // Optionally set user-facing error
    }
  }

  async function sendChatMessage(messageContent: string, threadId?: string) {
    setError(null);
    setMessages(prev => [...prev, {
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ message: messageContent, thread_id: threadId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Failed to send message');
      }

      const { task_id } = await response.json();
      
      let attempts = 0;
      while (attempts < MAX_POLLING_ATTEMPTS) {
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/status/?task_id=${task_id}`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.error || 'Failed to check message status');
        }

        const result = await statusResponse.json();
        
        if (result.status === 'completed') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.response,
            created_at: new Date().toISOString()
          }]);
          await loadThreads(); 
          if (!threadId) {
            const threadsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/threads/`, {
              headers: { 'Authorization': `Token ${token}` }
            });
            if (threadsResponse.ok) {
              const { threads: latestThreads } = await threadsResponse.json();
              if (latestThreads.length > 0) {
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
      console.error('Error in sendChatMessage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  
  async function loadChatHistory(threadId: string) {
    setError(null);
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }
  
  async function loadThreads() {
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
      console.error('Error loading threads:', error);
      if (threads.length === 0) setError(errorMessage);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const messageToSend = message;
    setMessage('');

    try {
      await sendChatMessage(messageToSend, currentThreadId);
    } catch (error) {
      console.error('Error sending message (handleSubmit):', error);
    }
  };

  const handleThreadSelect = (threadId?: string) => {
    setCurrentThreadId(threadId);
  };

  const renderedMessages = useMemo(() => messages.map((msg, index) => (
    <div
      key={`${msg.role}-${msg.created_at}-${index}`}
      className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block p-3 rounded-lg shadow-md ${ 
            msg.role === 'user' ? 'bg-[#7B6EF6] text-white' : 'bg-[#2A2D2E] text-gray-100'
          } prose prose-sm prose-invert max-w-none`}
        >
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )), [messages]);

  return (
    <div className="min-h-screen bg-[#141718] text-white py-6 font-inter flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow w-full max-w-4xl">
        
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-medium text-white mb-4 text-center sm:text-left">
            Discuss your Shopify store data and get AI assistance.
          </h1>
          <div className="flex justify-center sm:justify-start">
            <ConnectionsBar connections={connections} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <ThreadSelector
            threads={threads}
            currentThreadId={currentThreadId}
            onSelect={handleThreadSelect}
          />
          <Link href="/app/integrations" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-150">
              <Settings className="w-4 h-4" />
              Integrations
            </button>
          </Link>
        </div>

        <div className="flex-1 flex flex-col bg-[#1E1F20] rounded-xl shadow-2xl overflow-hidden min-h-[calc(100vh-20rem)] sm:min-h-[450px]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50 hover:scrollbar-thumb-gray-500">
            {renderedMessages}

            {!currentThreadId && messages.length === 1 && messages[0].role === 'assistant' && (
              <div className="my-4">
                <p className="text-sm text-gray-400 mb-2 text-center">Or try one of these:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {exampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMessage(q);
                        inputRef.current?.focus();
                      }}
                      className="p-3 bg-[#2A2D2E] text-gray-200 rounded-lg hover:bg-[#3A3D3E] text-left text-sm transition-colors duration-150 shadow-md"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {error && (
              <div className="my-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-center gap-2 shadow-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="break-all">Error: {error}</span>
              </div>
            )}

            {isLoading && messages[messages.length -1]?.role === 'user' && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 border-t border-[#252829] bg-[#1A1C1D]">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 bg-[#252829] text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7B6EF6] focus:border-transparent text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="px-4 sm:px-6 py-2.5 rounded-lg bg-[#7B6EF6] hover:bg-[#6A5ACD] text-white font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#7B6EF6] focus:ring-offset-2 focus:ring-offset-[#1A1C1D]"
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

// Reverted TypingIndicator
const TypingIndicator = memo(() => (
  <div className="mb-6 ml-4 flex justify-start">
    <p className="italic relative overflow-hidden text-gray-400">
      <span className="block bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
        Consulting your data...
      </span>
    </p>
  </div>
));

// Removed the tryParseJson helper as it was not used and added in error previously.