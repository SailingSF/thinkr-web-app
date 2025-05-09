'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/solid'; // Corrected import path

interface Thread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  display_name?: string; // Optional display name from spec
}

interface ThreadSelectorProps {
  threads: Thread[];
  currentThreadId?: string;
  onSelect: (threadId?: string) => void;
}

const ThreadSelector: React.FC<ThreadSelectorProps> = ({ threads, currentThreadId, onSelect }) => {
  const selectedThread = threads.find(t => t.thread_id === currentThreadId);

  // The "New Chat" option is represented by `undefined` threadId
  const newChatOption = { thread_id: '__NEW_CHAT__', display_name: 'New Chat', last_message: 'Start a new conversation', created_at: '', updated_at: '' };
  
  const allOptions = [newChatOption, ...threads];
  
  const currentSelection = currentThreadId ? selectedThread : newChatOption;

  const handleSelect = (selectedOption: Thread | typeof newChatOption) => {
    if (selectedOption.thread_id === '__NEW_CHAT__') {
      onSelect(undefined);
    } else {
      onSelect(selectedOption.thread_id);
    }
  };

  return (
    <div className="w-72"> {/* Adjust width as needed */}
      <Listbox value={currentSelection || newChatOption} onChange={handleSelect}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#232627] py-2.5 pl-3 pr-10 text-left text-white shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">
              {currentSelection ? (currentSelection.display_name || currentSelection.last_message || 'New Chat') : 'New Chat'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#232627] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {allOptions.map((item, itemIdx) => (
                <Listbox.Option
                  key={item.thread_id === '__NEW_CHAT__' ? 'new-chat' : item.thread_id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-[#7B6EF6] text-white' : 'text-gray-300'
                    }`
                  }
                  value={item}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {item.thread_id === '__NEW_CHAT__' 
                          ? <div className="flex items-center"><PlusIcon className="w-5 h-5 mr-2" />New Chat</div>
                          : (item.display_name || item.last_message || `Thread from ${new Date(item.updated_at).toLocaleDateString()}`)
                        }
                      </span>
                      { (item.thread_id !== '__NEW_CHAT__' && currentThreadId === item.thread_id) || (item.thread_id === '__NEW_CHAT__' && !currentThreadId) ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#7B6EF6]">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default ThreadSelector; 