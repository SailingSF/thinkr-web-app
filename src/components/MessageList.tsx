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
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
        <div className={`rounded-lg shadow-md ${isUser ? 'bg-gray-700 text-chat-text p-3' : 'text-chat-text p-3'} prose prose-sm prose-invert max-w-none font-light`}>
          {!isUser && (
            <div className="text-xs text-chat-icon mb-1">thinkr</div>
          )}
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
          
          {/* Show agent specification inline for assistant messages */}
          {!isUser && message.agent_specification && (
            <InlineAgentSpec specification={message.agent_specification} />
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = memo(() => (
  <div className="mb-6 ml-4 flex justify-start">
    <div className="bg-chat-input text-chat-text rounded-lg p-3 shadow-md">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-chat-icon" />
        <span className="text-sm italic text-chat-icon">
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
    <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-chat-border scrollbar-track-chat-dark/50 hover:scrollbar-thumb-chat-icon ${className}`}>
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