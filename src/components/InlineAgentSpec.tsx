'use client';

import { 
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon,
  BeakerIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { AgentSpecification } from '@/types/chat';
import { cronToSentence } from '@/lib/api/chat';

interface InlineAgentSpecProps {
  specification: AgentSpecification;
  onCreate?: (spec: AgentSpecification) => void;
  creating?: boolean;
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

export default function InlineAgentSpec({ specification, onCreate, creating }: InlineAgentSpecProps) {
  const { agent_type, specification: spec } = specification;
  const isGrowthAgent = agent_type === 'growth';
  const isAlertAgent = agent_type === 'alert';
  const isCustomReport = agent_type === 'custom_report';

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

  // Metrics for custom reports
  const metrics = Array.isArray(spec.metrics) ? spec.metrics : undefined;

  // Custom report schedule visualization
  const dayOfWeek = typeof spec.day_of_week === 'number' ? spec.day_of_week : undefined;
  const timeOfDay = spec.time_of_day;
  const timezone = spec.timezone;
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const scheduleLabel =
    dayOfWeek !== undefined && timeOfDay && timezone
      ? `${dayNames[Math.max(0, Math.min(6, dayOfWeek))]} at ${timeOfDay} (${timezone})`
      : undefined;

  // Do not early-return; we may still want to show the card for metrics-only specs

  return (
    <div className="mt-4 p-4 bg-[#2A2D2E] rounded-lg border border-gray-600">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          isGrowthAgent ? 'bg-green-500/20 text-green-400' : isAlertAgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {isGrowthAgent ? (
            <ChartBarIcon className="h-5 w-5" />
          ) : isAlertAgent ? (
            <BellIcon className="h-5 w-5" />
          ) : (
            <DocumentChartBarIcon className="h-5 w-5" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            {isGrowthAgent ? 'Growth Agent' : isAlertAgent ? 'Alert Agent' : 'Custom Report Agent'} Specification
          </h4>
          <p className="text-xs text-gray-400">
            {isGrowthAgent
              ? 'Automated growth analysis and reporting'
              : isAlertAgent
                ? 'Automated monitoring and alerts'
                : 'Custom reporting across selected metrics'}
          </p>
        </div>
      </div>

      {/* Parameters Grid */}
      {params.length > 0 && (
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
      )}

      {/* Custom report schedule */}
      {isCustomReport && scheduleLabel && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-purple-400" />
            Schedule
          </div>
          <div className="flex items-center gap-2 bg-[#1A1C1D] rounded-lg px-3 py-2 border border-gray-600 w-fit">
            <ClockIcon className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">{scheduleLabel}</span>
          </div>
        </div>
      )}

      {/* Metrics section */}
      {metrics && metrics.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4 text-purple-400" />
            Metrics Included
          </div>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m, idx) => (
              <span
                key={`${m}-${idx}`}
                className="px-2 py-1 text-xs rounded-md border border-gray-600 bg-[#1A1C1D] text-gray-200"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-4 pt-3 border-t border-gray-600 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          💬 You can adjust details and ask for modifications.
        </p>
        {onCreate && (
          <button
            onClick={() => onCreate(specification)}
            disabled={creating}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#7366FF] hover:bg-[#5F4EEB] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating…' : 'Create Agent'}
          </button>
        )}
      </div>
    </div>
  );
}