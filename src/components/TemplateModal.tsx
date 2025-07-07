import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  if (!open || !template) return null;

  const handleMakeAgent = () => {
    if (template) {
      // Store the prompt in localStorage to be picked up by the chat page
      localStorage.setItem('prefill_agent_prompt', template.prompt);
      localStorage.setItem('prefill_agent_intent', 'agent_builder');
      
      // Close modal and navigate to chat
      onClose();
      router.push('/app');
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
        <div className="mb-6">
          <h3 className="text-white text-base font-medium mb-1">Agent Prompt</h3>
          <div className="bg-[#23262B] text-[#B0B0B0] text-xs p-3 rounded-lg">
            <pre className="whitespace-pre-wrap break-words">
              {template.prompt}
            </pre>
          </div>
        </div>
        
        {/* Make This Agent Button */}
        <div className="flex justify-center">
          <button
            onClick={handleMakeAgent}
            className="bg-[#7B6EF6] hover:bg-[#6B5EE6] text-white font-medium px-8 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#7B6EF6] focus:ring-opacity-50"
          >
            Make This Agent
          </button>
        </div>
      </div>
    </div>
  );
} 