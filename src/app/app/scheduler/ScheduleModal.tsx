import { useState } from 'react';

interface Schedule {
  id: number;
  analysis_type: string;
  cron_expression: string;
  is_active: boolean;
  description: string;
  last_run: string | null;
  next_run: string | null;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleAdd: (schedule: Schedule) => void;
}

interface AnalysisType {
  name: string;
  displayName: string;
  description: string;
}

interface Day {
  value: string;
  label: string;
}

const ANALYSIS_TYPES: AnalysisType[] = [
  { name: 'inventory', displayName: 'Inventory Analysis', description: 'Track and analyze your inventory levels and movements' },
  { name: 'top_customers', displayName: 'Top Customer Analysis', description: 'Monitor top customers and their recent orders' },
  { name: 'financial_metrics', displayName: 'Financial Analysis', description: 'Analyze key financial indicators and trends' },
];

const DAYS: Day[] = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i-12} PM` : `${i} AM`
}));

export default function ScheduleModal({ isOpen, onClose, onScheduleAdd }: ScheduleModalProps) {
  const [analysisType, setAnalysisType] = useState<string>('');
  const [day, setDay] = useState<string>('1'); // Default to Monday
  const [hour, setHour] = useState<number>(9); // Default to 9 AM
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const getCronExpression = (): string => {
    return `0 ${hour} * * ${day}`;
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

      const selectedType = ANALYSIS_TYPES.find(type => type.name === analysisType);
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
          analysis_type: selectedType.name,
          cron_expression: getCronExpression(),
          description: description.trim() || `${selectedType.displayName} - Weekly on ${DAYS.find(d => d.value === day)?.label} at ${HOURS[hour].label}`,
          is_active: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      const responseData = await response.json();
      // Create a schedule object from the response
      const newSchedule: Schedule = {
        id: responseData.schedule_id,
        analysis_type: selectedType.name,
        cron_expression: getCronExpression(),
        is_active: true,
        description: description.trim() || `${selectedType.displayName} - Weekly on ${DAYS.find(d => d.value === day)?.label} at ${HOURS[hour].label}`,
        last_run: null,
        next_run: responseData.next_run
      };
      
      onScheduleAdd(newSchedule);
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
        <h2 className="text-2xl font-bold mb-6 text-white">Schedule Weekly Suggestion</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Select Suggestion Improvements:</label>
            <div className="space-y-2">
              {ANALYSIS_TYPES.map((type) => (
                <div
                  key={type.name}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    analysisType === type.name
                      ? 'bg-[#2c2d32]'
                      : 'bg-[#2c2d32] hover:bg-[#32333a]'
                  }`}
                  onClick={() => setAnalysisType(type.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAnalysisType(type.name);
                    }
                  }}
                >
                  <div className="font-medium text-white">{type.displayName}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Day of the Week</label>
              <div className="relative">
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF] appearance-none cursor-pointer pr-8"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value} className="bg-[#2c2d32]">
                      {d.label}
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

            <div>
              <label className="block text-sm text-gray-400 mb-2">Time</label>
              <div className="relative">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF] appearance-none cursor-pointer pr-8"
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
            <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[#2c2d32] rounded-lg text-white border-none focus:ring-1 focus:ring-[#8C74FF] resize-none"
              rows={2}
              placeholder="Add a note about this schedule..."
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
              className="px-6 py-2 text-white hover:bg-[#2c2d32] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !analysisType}
              className="px-6 py-2 bg-[#8C74FF] hover:bg-[#7B63EE] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 