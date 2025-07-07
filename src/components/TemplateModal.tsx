import React, { useState } from 'react';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  template: {
    title: string;
    category: string;
    integrations: string[];
    goal: string;
    kpi: string;
    prompt: string;
  } | null;
}

export default function TemplateModal({ open, onClose, template }: TemplateModalProps) {
  const [copied, setCopied] = useState(false);
  if (!open || !template) return null;

  const handleCopy = async () => {
    if (template) {
      await navigator.clipboard.writeText(template.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#181B1F] rounded-xl shadow-2xl w-full max-w-2xl p-12 relative border border-[#2A2D31]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7B7B7B] hover:text-white text-2xl font-bold focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
        {/* Category Tag */}
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-[#2A2D31] text-[#7B7B7B] text-sm rounded-full">
            {template.category}
          </span>
        </div>
        {/* Title */}
        <h2 className="text-2xl text-white font-semibold mb-2">{template.title}</h2>
        {/* Integrations */}
        <div className="flex gap-2 mb-4">
          {template.integrations.map((integration, idx) => (
            <div
              key={idx}
              className="w-8 h-8 bg-[#23262B] rounded-full flex items-center justify-center"
              title={integration}
            >
              <span className="text-[#7B7B7B] text-base font-medium">
                {integration.charAt(0).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        {/* Goal */}
        <div className="mb-3">
          <h3 className="text-white text-base font-medium mb-1">Goal</h3>
          <p className="text-[#B0B0B0] text-sm">{template.goal}</p>
        </div>
        {/* KPI */}
        <div className="mb-3">
          <h3 className="text-white text-base font-medium mb-1">Key Metric</h3>
          <p className="text-[#B0B0B0] text-sm">{template.kpi}</p>
        </div>
        {/* Prompt */}
        <div className="mb-2">
          <h3 className="text-white text-base font-medium mb-1">Agent Prompt</h3>
          <div className="relative group">
            <pre className="bg-[#23262B] text-[#B0B0B0] text-xs p-3 rounded-lg whitespace-pre-wrap break-words">
              {template.prompt}
            </pre>
            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium transition-opacity bg-[#23262B] border border-[#3A3D41] text-[#7B7B7B] hover:text-white hover:bg-[#23262B] focus:outline-none opacity-0 group-hover:opacity-100 ${copied ? '!opacity-100 bg-[#2A2D31] text-green-400 border-green-400' : ''}`}
              style={{zIndex: 2}}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 