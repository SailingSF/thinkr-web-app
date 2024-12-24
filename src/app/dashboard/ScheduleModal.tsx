import { useState } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleAdd: () => void;
}

interface AnalysisType {
  id: number;
  analysis_type: string;
  name: string;
  description: string;
}

interface Frequency {
  id: string;
  name: string;
  expression: string;
}

interface Hour {
  value: number;
  label: string;
}

// Must use id numbers for analysis_type in api
const ANALYSIS_TYPES: AnalysisType[] = [
  { id: 1, analysis_type: 'inventory', name: 'Inventory Analysis', description: 'Track and analyze your inventory levels and movements' },
  { id: 2, analysis_type: 'orders', name: 'Orders Analysis', description: 'Monitor order patterns and performance metrics' },
  { id: 3, analysis_type: 'financial-metrics', name: 'Basic Analytics', description: 'Analyze key financial indicators and trends from one month of data' },
];

const FREQUENCIES: Frequency[] = [
  { id: 'daily', name: 'Daily', expression: '0 0 * * *' },
  { id: 'weekly', name: 'Weekly', expression: '0 0 * * 1' },
  { id: 'monthly', name: 'Monthly', expression: '0 0 1 * *' },
];

const HOURS: Hour[] = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i-12} PM` : `${i} AM`
}));

export default function ScheduleModal({ isOpen, onClose, onScheduleAdd }: ScheduleModalProps) {
  const [analysisType, setAnalysisType] = useState<string>('');
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[0].id);
  const [hour, setHour] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const getCronExpression = (): string => {
    const selectedFreq = FREQUENCIES.find(f => f.id === frequency);
    if (!selectedFreq) return FREQUENCIES[0].expression;
    return selectedFreq.expression.replace('0 0', `0 ${hour}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const selectedType = ANALYSIS_TYPES.find(type => type.analysis_type === analysisType);
      if (!selectedType) {
        throw new Error('Please select an analysis type');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          analysis_type: selectedType.id,
          cron_expression: getCronExpression(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      onScheduleAdd();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#25262b] p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Add Analytics Schedule</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">What would you like to analyze?</label>
            <div className="space-y-2">
              {ANALYSIS_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    analysisType === type.analysis_type
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-purple-400'
                  }`}
                  onClick={() => setAnalysisType(type.analysis_type)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAnalysisType(type.analysis_type);
                    }
                  }}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">How often should this run?</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq.id}
                  type="button"
                  className={`p-2 rounded-md text-center transition-all ${
                    frequency === freq.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-[#2c2d32] hover:bg-[#35363c]'
                  }`}
                  onClick={() => setFrequency(freq.id)}
                >
                  {freq.name}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">At what time?</label>
              <div className="relative">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full p-2 bg-[#2c2d32] rounded-md border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer pr-8"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                  {HOURS.map((h) => (
                    <option key={h.value} value={h.value} className="bg-[#2c2d32]">
                      {h.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[#2c2d32] rounded-md border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              rows={2}
              placeholder="Add a note about this schedule..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:bg-[#2c2d32] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !analysisType}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 