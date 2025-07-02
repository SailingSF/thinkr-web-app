'use client';

import { memo } from 'react';
import { Thread } from '@/types/chat';
import { generateThreadTitle } from '@/lib/api/chat';

interface SimpleThreadListProps {
  threads: Thread[];
  currentThreadId?: string;
  onSelect: (threadId: string) => void;
  loading?: boolean;
}

function ThreadItem({ 
  thread, 
  isActive, 
  onClick 
}: { 
  thread: Thread; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const title = generateThreadTitle(thread.display_name, thread.last_message);
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
        isActive 
          ? 'bg-[#7B6EF6] text-white' 
          : 'text-gray-300 hover:text-white hover:bg-[#2A2D2E]'
      }`}
      title={title}
    >
      {title}
    </button>
  );
}

const ThreadItemMemo = memo(ThreadItem);

export default function SimpleThreadList({
  threads,
  currentThreadId,
  onSelect,
  loading = false,
}: SimpleThreadListProps) {
  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    );
  }

  if (threads.length === 0) {
    return null; // Don't show anything if no threads
  }

  // Only show recent threads (last 5)
  const recentThreads = threads.slice(0, 5);

  return (
    <div className="space-y-1">
      {recentThreads.map((thread) => (
        <ThreadItemMemo
          key={thread.thread_id}
          thread={thread}
          isActive={currentThreadId === thread.thread_id}
          onClick={() => onSelect(thread.thread_id)}
        />
      ))}
      {threads.length > 5 && (
        <div className="px-3 py-1 text-xs text-gray-500">
          +{threads.length - 5} more conversations
        </div>
      )}
    </div>
  );
}