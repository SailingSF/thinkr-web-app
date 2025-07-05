'use client';

import { memo, useEffect, useRef } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ChatMessage } from '@/types/chat';
import InlineAgentSpec from './InlineAgentSpec';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        {!isUser && (
          <div className="text-xs text-gray-400 mb-1">thinkr</div>
        )}
        <div
          className={`inline-block p-3 rounded-lg shadow-md ${
            isUser ? 'bg-gray-700 text-white' : 'text-gray-100'
          } prose prose-sm prose-invert max-w-none`}
        >
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
          
          {/* Show agent specification inline for assistant messages */}
          {!isUser && message.agent_specification && (
            <InlineAgentSpec specification={message.agent_specification} />
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = memo(() => (
  <div className="mb-6 ml-4 flex justify-start">
    <div className="bg-[#2A2D2E] text-gray-100 rounded-lg p-3 shadow-md">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm italic text-gray-400">
          Consulting your data...
        </span>
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  className?: string;
}

export default function MessageList({ 
  messages, 
  isLoading = false,
  error,
  onErrorDismiss,
  className = ''
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50 hover:scrollbar-thumb-gray-500 ${className}`}>
      {messages.map((message, index) => (
        <MessageBubble 
          key={`${message.id || message.role}-${message.created_at}-${index}`} 
          message={message} 
        />
      ))}
      
      {error && (
        <div className="my-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-center gap-2 shadow-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="break-all flex-1">Error: {error}</span>
          {onErrorDismiss && (
            <button
              onClick={onErrorDismiss}
              className="text-red-200 hover:text-white ml-2 flex-shrink-0"
              aria-label="Dismiss error"
            >
              ×
            </button>
          )}
        </div>
      )}

      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <TypingIndicator />
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}