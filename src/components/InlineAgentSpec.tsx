'use client';

import { 
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { AgentSpecification } from '@/types/chat';
import { cronToSentence } from '@/lib/api/chat';

interface InlineAgentSpecProps {
  specification: AgentSpecification;
}

function ParamChip({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#1A1C1D] rounded-lg px-3 py-2 border border-gray-600">
      <Icon className="h-4 w-4 text-purple-400 flex-shrink-0" />
      <div>
        <span className="text-xs text-gray-400 uppercase tracking-wide block">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
    </div>
  );
}

export default function InlineAgentSpec({ specification }: InlineAgentSpecProps) {
  const { agent_type, specification: spec } = specification;
  const isGrowthAgent = agent_type === 'growth';
  const isAlertAgent = agent_type === 'alert';

  const params = [];

  // Analysis Type for Growth agents
  if (isGrowthAgent && spec.analysis_type) {
    params.push({
      icon: BeakerIcon,
      label: 'Analysis Type',
      value: spec.analysis_type,
    });
  }

  // Schedule for Growth agents
  if (isGrowthAgent && spec.cron_expression) {
    params.push({
      icon: CalendarIcon,
      label: 'Schedule',
      value: cronToSentence(spec.cron_expression),
    });
  }

  // Alert agent parameters
  if (isAlertAgent) {
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

  // Additional context for both types
  if (spec.additional_context) {
    params.push({
      icon: InformationCircleIcon,
      label: 'Context',
      value: spec.additional_context,
    });
  }

  if (params.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-[#2A2D2E] rounded-lg border border-gray-600">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          isGrowthAgent ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isGrowthAgent ? (
            <ChartBarIcon className="h-5 w-5" />
          ) : (
            <BellIcon className="h-5 w-5" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            {isGrowthAgent ? 'Growth Agent' : 'Alert Agent'} Specification
          </h4>
          <p className="text-xs text-gray-400">
            {isGrowthAgent ? 'Automated growth analysis and reporting' : 'Automated monitoring and alerts'}
          </p>
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {params.map((param, index) => (
          <ParamChip
            key={index}
            icon={param.icon}
            label={param.label}
            value={param.value}
          />
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <p className="text-xs text-gray-400">
          💬 Respond with "Yes" or "Create this agent" to confirm, or ask for modifications.
        </p>
      </div>
    </div>
  );
}