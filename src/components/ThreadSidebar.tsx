'use client';

import { memo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  PlusIcon,
  ChatBubbleLeftRightIcon,
  DocumentMagnifyingGlassIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { Thread, ChatIntent } from '@/types/chat';

interface ThreadSidebarProps {
  threads: Thread[];
  currentThreadId?: string;
  onSelect: (threadId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
}

const intentIcons = {
  ask: ChatBubbleLeftRightIcon,
  research: DocumentMagnifyingGlassIcon,
  agent_builder: CpuChipIcon,
};

const intentColors = {
  ask: 'bg-blue-500',
  research: 'bg-green-500',
  agent_builder: 'bg-purple-500',
};

function ThreadItem({ 
  thread, 
  isActive, 
  onClick 
}: { 
  thread: Thread; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const Icon = intentIcons[thread.intent || 'ask'];
  const colorClass = intentColors[thread.intent || 'ask'];
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-colors ${
        isActive 
          ? 'bg-[#7B6EF6] text-white' 
          : 'hover:bg-[#2A2D2E] text-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full ${colorClass} mt-2 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium opacity-75">
              {thread.intent || 'ask'}
            </span>
          </div>
          <p className="text-sm font-medium truncate">
            {thread.display_name || 'Untitled Chat'}
          </p>
          {thread.last_message && (
            <p className="text-xs opacity-75 truncate mt-1">
              {thread.last_message}
            </p>
          )}
          <p className="text-xs opacity-50 mt-1">
            {new Date(thread.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </button>
  );
}

const ThreadItemMemo = memo(ThreadItem);

export default function ThreadSidebar({
  threads,
  currentThreadId,
  onSelect,
  isOpen,
  onClose,
  loading = false,
}: ThreadSidebarProps) {
  const handleNewChat = () => {
    onSelect(undefined);
    onClose();
  };

  const handleThreadSelect = (threadId: string) => {
    onSelect(threadId);
    onClose();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <SidebarContent
                  threads={threads}
                  currentThreadId={currentThreadId}
                  onNewChat={handleNewChat}
                  onThreadSelect={handleThreadSelect}
                  loading={loading}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-80 lg:flex-col">
        <SidebarContent
          threads={threads}
          currentThreadId={currentThreadId}
          onNewChat={handleNewChat}
          onThreadSelect={handleThreadSelect}
          loading={loading}
        />
      </div>
    </>
  );
}

function SidebarContent({
  threads,
  currentThreadId,
  onNewChat,
  onThreadSelect,
  loading,
}: {
  threads: Thread[];
  currentThreadId?: string;
  onNewChat: () => void;
  onThreadSelect: (threadId: string) => void;
  loading: boolean;
}) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#1A1C1D] px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Conversations</h2>
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-400 hover:text-white hover:bg-[#2A2D2E] rounded-md transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <nav className="flex flex-1 flex-col">
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-400">Loading conversations...</div>
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-500 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            threads.map((thread) => (
              <ThreadItemMemo
                key={thread.thread_id}
                thread={thread}
                isActive={currentThreadId === thread.thread_id}
                onClick={() => onThreadSelect(thread.thread_id)}
              />
            ))
          )}
        </div>
      </nav>
    </div>
  );
}