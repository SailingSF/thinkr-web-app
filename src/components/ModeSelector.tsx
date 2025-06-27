'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ChatBubbleLeftRightIcon, DocumentMagnifyingGlassIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { ChatIntent } from '@/types/chat';

interface ModeSelectorProps {
  mode: ChatIntent;
  onChange: (mode: ChatIntent) => void;
  disabled?: boolean;
}

const modes = [
  {
    value: 'ask' as ChatIntent,
    label: 'Ask',
    description: 'Quick questions and chat assistance',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    value: 'research' as ChatIntent,
    label: 'Research',
    description: 'Deep analysis and comprehensive reports',
    icon: DocumentMagnifyingGlassIcon,
  },
  {
    value: 'agent_builder' as ChatIntent,
    label: 'Agents',
    description: 'Create automated monitoring agents',
    icon: CpuChipIcon,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ModeSelector({ mode, onChange, disabled = false }: ModeSelectorProps) {
  const currentMode = modes.find(m => m.value === mode) || modes[0];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          disabled={disabled}
          className={classNames(
            'inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset',
            disabled
              ? 'bg-gray-700 text-gray-400 ring-gray-600 cursor-not-allowed'
              : 'bg-[#2A2D2E] text-white ring-gray-600 hover:bg-[#3A3D3E]'
          )}
        >
          <currentMode.icon className="h-5 w-5" aria-hidden="true" />
          {currentMode.label}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-72 origin-top-left rounded-md bg-[#2A2D2E] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {modes.map((modeOption) => (
              <Menu.Item key={modeOption.value}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(modeOption.value)}
                    className={classNames(
                      active ? 'bg-[#3A3D3E] text-white' : 'text-gray-300',
                      mode === modeOption.value ? 'bg-[#7B6EF6] text-white' : '',
                      'group flex w-full items-start px-4 py-3 text-sm transition-colors'
                    )}
                  >
                    <modeOption.icon
                      className={classNames(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        mode === modeOption.value ? 'text-white' : 'text-gray-400'
                      )}
                      aria-hidden="true"
                    />
                    <div className="text-left">
                      <div className="font-medium">{modeOption.label}</div>
                      <div className={classNames(
                        'text-xs',
                        mode === modeOption.value ? 'text-purple-100' : 'text-gray-500'
                      )}>
                        {modeOption.description}
                      </div>
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}