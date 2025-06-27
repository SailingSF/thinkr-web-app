'use client';

import { ChatIntent } from '@/types/chat';

interface SegmentedModeSelectorProps {
  mode: ChatIntent;
  onChange: (mode: ChatIntent) => void;
  disabled?: boolean;
}

const modes = [
  {
    value: 'ask' as ChatIntent,
    label: 'Ask',
  },
  {
    value: 'research' as ChatIntent,
    label: 'Research',
  },
  {
    value: 'agent_builder' as ChatIntent,
    label: 'Agents',
  },
];

export default function SegmentedModeSelector({ mode, onChange, disabled = false }: SegmentedModeSelectorProps) {
  return (
    <div className="flex bg-[#2A2D2E] rounded-lg p-1">
      {modes.map((modeOption) => (
        <button
          key={modeOption.value}
          onClick={() => onChange(modeOption.value)}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 min-w-[80px]
            ${mode === modeOption.value 
              ? 'bg-[#7B6EF6] text-white shadow-sm' 
              : 'text-gray-300 hover:text-white hover:bg-[#3A3D3E]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {modeOption.label}
        </button>
      ))}
    </div>
  );
}