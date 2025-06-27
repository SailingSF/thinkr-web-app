'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Loader2, Send } from 'lucide-react';

interface ComposerProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function Composer({ 
  onSubmit, 
  disabled = false, 
  placeholder = 'Ask anything...',
  className = ''
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    const messageToSend = message.trim();
    setMessage('');
    onSubmit(messageToSend);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.altKey || e.shiftKey) {
        // Alt+Enter or Shift+Enter inserts a newline
        return;
      } else {
        // Enter submits the form
        e.preventDefault();
        handleSubmit(e);
      }
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  return (
    <div className={`p-3 sm:p-4 border-t border-[#252829] bg-[#1A1C1D] ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-[#252829] text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7B6EF6] focus:border-transparent text-sm sm:text-base resize-none min-h-[42px] max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
          style={{ height: 'auto' }}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-4 sm:px-6 py-2.5 rounded-lg bg-[#7B6EF6] hover:bg-[#6A5ACD] text-white font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#7B6EF6] focus:ring-offset-2 focus:ring-offset-[#1A1C1D] flex-shrink-0 min-h-[42px] flex items-center justify-center"
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </form>
      
      {/* Help text */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to send, 
        <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs ml-1">Alt+Enter</kbd> for new line
      </div>
    </div>
  );
}