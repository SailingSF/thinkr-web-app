'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ChatMessage } from '@/types/chat';
import InlineAgentSpec from './InlineAgentSpec';
import React from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  // Helper to strip markdown for copying (simple fallback)
  function stripMarkdown(md: string) {
    return md.replace(/[#*_`>\-\[\]()!]/g, '').replace(/\n{2,}/g, '\n');
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(stripMarkdown(message.content));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`mb-2 sm:mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90vw] sm:max-w-[80%] flex flex-col ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
        <div className={`rounded-lg shadow-md ${isUser ? 'bg-gray-700 text-chat-text p-2 sm:p-3' : 'text-chat-text p-2 sm:p-3'} prose prose-xs sm:prose-sm prose-invert max-w-none font-light relative`}>
          {!isUser && (
            <div className="relative group w-fit inline-block align-middle">
              <div className="text-xs text-chat-icon mb-1 inline-block align-middle">thinkr</div>
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs bg-[#232425] rounded px-2 py-1 border border-gray-700 whitespace-nowrap text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-10">
                Hey! How can I help you?
              </span>
            </div>
          )}
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
          
          {/* Show agent specification inline for assistant messages */}
          {!isUser && message.agent_specification && (
            <InlineAgentSpec specification={message.agent_specification} />
          )}
          {/* Copy button for assistant messages */}
          {!isUser && (
            <div className="relative group w-fit inline-block align-middle">
              <button
                onClick={handleCopy}
                className="p-0 m-0 bg-transparent border-none shadow-none text-chat-icon hover:text-white transition-colors inline-block align-middle"
                style={{ zIndex: 2 }}
                title=""
                aria-label="Copy response"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                  <rect x="4" y="4" width="8" height="8" rx="2"/>
                  <path d="M6 2h4a2 2 0 0 1 2 2v8"/>
                </svg>
              </button>
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs bg-[#232425] rounded px-2 py-1 border border-gray-700 whitespace-nowrap text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-10">
                {copied ? 'Copied!' : 'Copy response'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// Fix TypewriterText props typing
interface TypewriterTextProps {
  text: string;
  speed?: number;
  onDone?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 50, onDone }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);
  return <span>{displayed}</span>;
};

const TypingIndicator = memo(() => {
  const [typewriterKey, setTypewriterKey] = useState(0);

  // When the typewriter finishes, restart the animation after 500ms
  const handleTypewriterDone = () => {
    setTimeout(() => {
      setTypewriterKey((k) => k + 1);
    }, 500);
  };

  return (
    <div className="flex items-start space-x-2">
      <Loader2 className="h-4 w-4 animate-spin text-chat-icon mt-1" />
      <div className="flex flex-col">
        <span className="text-sm italic text-chat-icon">
          <TypewriterText
            key={typewriterKey}
            text="Consulting your data..."
            speed={50}
            onDone={handleTypewriterDone}
          />
        </span>
      </div>
    </div>
  );
});

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
    // Scroll to the very bottom but keep the last message comfortably above the input bar
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className={`flex-1 overflow-y-auto p-2 sm:p-6 space-y-2 sm:space-y-4 scrollbar-thin scrollbar-thumb-chat-border scrollbar-track-chat-dark/50 hover:scrollbar-thumb-chat-icon ${className}`}>
      {messages.map((message, index) => (
        <MessageBubble 
          key={`${message.id || message.role}-${message.created_at}-${index}`} 
          message={message} 
        />
      ))}
      
      {error && (
        <div className="my-2 sm:my-4 p-2 sm:p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-xs sm:text-sm flex items-center gap-2 shadow-md">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
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
      
      {/* Spacer to ensure the last message isn't hidden behind the input bar */}
      <div ref={messagesEndRef} />
    </div>
  );
}