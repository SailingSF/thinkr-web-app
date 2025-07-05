'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { AgentSpecification } from '@/types/chat';
import { cronToSentence } from '@/lib/api/chat';

interface ParamChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}

function ParamChip({ icon: Icon, label, value, className = '' }: ParamChipProps) {
  return (
    <div className={`bg-[#232425] rounded-xl p-4 border border-gray-700 flex items-center gap-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7366FF]/10">
        <Icon className="h-5 w-5 text-[#7366FF]" />
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
        <div className="text-base font-medium text-white break-words">{value}</div>
      </div>
    </div>
  );
}

interface ParamGridProps {
  specification: AgentSpecification;
}

function ParamGrid({ specification }: ParamGridProps) {
  const { agent_type, specification: spec } = specification;
  const params = [];

  // Common parameters
  if (spec.additional_context) {
    params.push({
      icon: InformationCircleIcon,
      label: 'Context',
      value: spec.additional_context,
    });
  }

  // Growth agent parameters
  if (agent_type === 'growth' && spec.cron_expression) {
    params.push({
      icon: CalendarIcon,
      label: 'Schedule',
      value: cronToSentence(spec.cron_expression),
    });
  }

  // Alert agent parameters
  if (agent_type === 'alert') {
    if (spec.alert_name) {
      params.push({
        icon: BellIcon,
        label: 'Alert Name',
        value: spec.alert_name,
      });
    }

    if (spec.alert_metric) {
      params.push({
        icon: ChartBarIcon,
        label: 'Metric',
        value: spec.alert_metric,
      });
    }

    if (spec.alert_threshold_type && spec.alert_threshold_value !== undefined) {
      const symbol = spec.alert_threshold_type === 'gt' ? '>' : '<';
      params.push({
        icon: ExclamationTriangleIcon,
        label: 'Threshold',
        value: `${symbol} ${spec.alert_threshold_value}`,
      });
    }

    if (spec.alert_frequency) {
      params.push({
        icon: ClockIcon,
        label: 'Frequency',
        value: spec.alert_frequency,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {params.map((param, index) => (
        <ParamChip
          key={index}
          icon={param.icon}
          label={param.label}
          value={param.value}
        />
      ))}
    </div>
  );
}

interface AgentHeaderProps {
  agentType: 'growth' | 'alert';
  title?: string;
}

function AgentHeader({ agentType, title }: AgentHeaderProps) {
  const Icon = agentType === 'growth' ? ChartBarIcon : BellIcon;
  const defaultTitle = agentType === 'growth' ? 'Growth Agent' : 'Alert Agent';
  const color = agentType === 'growth' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-14 h-14 flex items-center justify-center rounded-full ${color} shadow-md`}>
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{title || defaultTitle}</h3>
        <p className="text-sm text-gray-400 capitalize">{agentType} Agent</p>
      </div>
    </div>
  );
}

interface AgentDescriptionProps {
  description: string;
}

function AgentDescription({ description }: AgentDescriptionProps) {
  return (
    <div className="mb-8">
      <h4 className="text-base font-semibold text-gray-300 mb-2">Description</h4>
      <p className="text-base text-gray-100 leading-relaxed">{description}</p>
    </div>
  );
}

interface DrawerFooterProps {
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  loading?: boolean;
}

function DrawerFooter({ 
  onConfirm, 
  onCancel, 
  confirmText = 'Create Agent',
  loading = false 
}: DrawerFooterProps) {
  return (
    <div className="flex flex-col gap-3 pt-8 border-t border-gray-700">
      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full px-6 py-3 bg-[#7366FF] hover:bg-[#5F4EEB] text-white text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
      >
        {loading ? 'Creating...' : confirmText}
      </button>
      <button
        onClick={onCancel}
        disabled={loading}
        className="w-full px-6 py-3 text-base font-semibold text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

interface AgentPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  specification: AgentSpecification | null;
  description?: string;
  onConfirm: (spec: AgentSpecification) => void;
  loading?: boolean;
  title?: string;
}

export default function AgentPreviewDrawer({
  isOpen,
  onClose,
  specification,
  description,
  onConfirm,
  loading = false,
  title,
}: AgentPreviewDrawerProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  const handleConfirm = () => {
    if (specification) {
      onConfirm(specification);
    }
  };

  const handleCopyJson = () => {
    if (specification) {
      navigator.clipboard.writeText(JSON.stringify(specification, null, 2));
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-[#202124] py-8 px-6 shadow-2xl rounded-2xl border border-[#232425]">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          Agent Preview
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-[#1A1C1D] text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {specification ? (
                        <>
                          <AgentHeader 
                            agentType={specification.agent_type} 
                            title={title}
                          />
                          
                          {description && (
                            <AgentDescription description={description} />
                          )}
                          
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-300">
                                Configuration
                              </h4>
                              <button
                                onClick={() => setShowRawJson(!showRawJson)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                              >
                                <CodeBracketIcon className="h-4 w-4" />
                                {showRawJson ? 'Hide' : 'Show'} JSON
                              </button>
                            </div>
                            
                            {showRawJson ? (
                              <div className="relative">
                                <pre className="bg-[#0D1117] text-gray-300 text-xs p-3 rounded-lg overflow-x-auto border border-gray-600">
{JSON.stringify(specification, null, 2)}
                                </pre>
                                <button
                                  onClick={handleCopyJson}
                                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                                >
                                  Copy
                                </button>
                              </div>
                            ) : (
                              <ParamGrid specification={specification} />
                            )}
                          </div>
                          
                          <DrawerFooter
                            onConfirm={handleConfirm}
                            onCancel={onClose}
                            loading={loading}
                          />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-gray-400">No agent specification available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}