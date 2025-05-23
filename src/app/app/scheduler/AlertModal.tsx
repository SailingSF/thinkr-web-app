import { useState, useEffect } from 'react';
import { Alert, CreateAlertRequest, UsageStatus } from '@/hooks/useLocalStorage';
import { useAuthFetch } from '@/utils/shopify';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertAdd: (alert: Alert) => void;
  usageStatus?: UsageStatus;
}

interface MetricType {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: JSX.Element;
  unit: string;
}

const METRIC_TYPES: MetricType[] = [
  {
    name: 'inventory_level',
    displayName: 'Inventory Level',
    description: 'Monitor stock levels for specific products',
    color: '#FF9800',
    unit: 'units',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    )
  },
  {
    name: 'orders_count',
    displayName: 'Orders Count',
    description: 'Track the number of orders over time',
    color: '#2196F3',
    unit: 'orders',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
      </svg>
    )
  },
  {
    name: 'revenue',
    displayName: 'Revenue',
    description: 'Monitor revenue thresholds and trends',
    color: '#4CAF50',
    unit: '$',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    )
  },
  {
    name: 'customer_count',
    displayName: 'Customer Count',
    description: 'Track customer acquisition and retention',
    color: '#9C27B0',
    unit: 'customers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
];

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Every Day' },
  { value: 'weekly', label: 'Every Week' },
  { value: 'monthly', label: 'Every Month' }
];

const THRESHOLD_TYPES = [
  { value: 'gt', label: 'Greater than', description: 'Alert when value exceeds threshold' },
  { value: 'lt', label: 'Less than', description: 'Alert when value falls below threshold' }
];

export default function AlertModal({ isOpen, onClose, onAlertAdd, usageStatus }: AlertModalProps) {
  const authFetch = useAuthFetch();
  const [name, setName] = useState('');
  const [metric, setMetric] = useState('');
  const [thresholdType, setThresholdType] = useState<'gt' | 'lt'>('gt');
  const [thresholdValue, setThresholdValue] = useState<number>(0);
  const [frequency, setFrequency] = useState('daily');
  const [instructions, setInstructions] = useState('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setMetric('');
      setThresholdType('gt');
      setThresholdValue(0);
      setFrequency('daily');
      setInstructions('');
      setParameters({});
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMetric = METRIC_TYPES.find(m => m.name === metric);
  const canCreateAlert = !usageStatus || !usageStatus.alerts || usageStatus.alerts.used < usageStatus.alerts.limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!canCreateAlert) {
        throw new Error(`You have reached the limit of ${usageStatus?.alerts?.limit || 'your plan'} alerts for your plan. Please upgrade or deactivate existing alerts.`);
      }

      const selectedMetricType = METRIC_TYPES.find(m => m.name === metric);
      if (!selectedMetricType) {
        throw new Error('Please select a metric type');
      }

      if (!name.trim()) {
        throw new Error('Please enter an alert name');
      }

      if (thresholdValue <= 0) {
        throw new Error('Please enter a valid threshold value');
      }

      const alertData: CreateAlertRequest = {
        name: name.trim(),
        metric: metric as CreateAlertRequest['metric'],
        parameters: {
          source: 'shopify',
          shopify_user_id: 'current_user', // Backend will set this
          ...parameters
        },
        instructions: instructions.trim() || undefined,
        threshold_type: thresholdType,
        threshold_value: thresholdValue,
        frequency
      };

      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Failed to create alert');
      }

      const newAlert = await response.json() as Alert;
      onAlertAdd(newAlert);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#25262b] p-6 md:p-8 rounded-xl w-full max-w-4xl font-inter max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2c2d32]"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-normal mb-2 text-white">Create Alert Agent</h2>
          <p className="text-sm text-[#7B7B7B] mb-4">
            Set up automated alerts to monitor your store's performance and get notified when thresholds are met.
          </p>
          {usageStatus && usageStatus.alerts && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#7B7B7B]">
                Usage: {usageStatus.alerts.used}/{usageStatus.alerts.limit} alerts
              </span>
              <div className="flex-1 max-w-32 bg-[#2C2D32] rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(usageStatus.alerts.percentage, 100)}%`,
                    backgroundColor: usageStatus.alerts.percentage >= 100 ? '#F44336' : '#8C74FF'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-3">Alert Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF]"
              placeholder="e.g., Low Inventory Alert"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Metric to Monitor</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {METRIC_TYPES.map((type) => {
                const isSelected = metric === type.name;
                return (
                  <div
                    key={type.name}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-opacity-10 border-opacity-100'
                        : 'bg-[#2c2d32] hover:bg-[#32333a] border-transparent hover:border-[#3c3d42]'
                    }`}
                    style={{
                      borderColor: isSelected ? type.color : 'transparent',
                      backgroundColor: isSelected ? `${type.color}20` : '#2c2d32'
                    }}
                    onClick={() => setMetric(type.name)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0" style={{ color: type.color }}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium mb-1`} style={{ color: isSelected ? type.color : 'white' }}>
                          {type.displayName}
                        </div>
                        <p className="text-sm text-[#9a9a9a] leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color }}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Alert Condition</label>
              <div className="relative">
                <select
                  value={thresholdType}
                  onChange={(e) => setThresholdType(e.target.value as 'gt' | 'lt')}
                  className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF] appearance-none cursor-pointer pr-8"
                >
                  {THRESHOLD_TYPES.map((type) => (
                    <option key={type.value} value={type.value} className="bg-[#2c2d32]">
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Threshold Value {selectedMetric && `(${selectedMetric.unit})`}
              </label>
              <input
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(Number(e.target.value))}
                className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF]"
                placeholder="Enter value"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Check Frequency</label>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF] appearance-none cursor-pointer pr-8"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#2c2d32]">
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Custom Instructions (Optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF] resize-none"
              rows={3}
              placeholder="Add specific instructions for when this alert triggers..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-white hover:bg-[#2c2d32] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !metric || !canCreateAlert}
              className="px-8 py-2.5 bg-[#8C74FF] hover:bg-[#7B63EE] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 