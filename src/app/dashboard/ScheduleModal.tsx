import { useState } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleAdd: () => void;
}

const ANALYSIS_TYPES = [
  { id: 1, analysis_type: 'inventory', name: 'Inventory Analysis' },
  { id: 2, analysis_type: 'orders', name: 'Orders Analysis' },
  { id: 3, analysis_type: 'financial-metrics', name: 'Financial Metrics' },
];

const CRON_EXAMPLES = [
  { expression: '0 0 * * *', description: 'Every day at midnight' },
  { expression: '0 */6 * * *', description: 'Every 6 hours' },
  { expression: '0 0 * * MON', description: 'Every Monday at midnight' },
  { expression: '0 0 1 * *', description: 'First day of every month' },
];

export default function ScheduleModal({ isOpen, onClose, onScheduleAdd }: ScheduleModalProps) {
  const [analysisType, setAnalysisType] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCronHelp, setShowCronHelp] = useState(false);

  if (!isOpen) return null;

  const handleCronExampleClick = (expression: string) => {
    setCronExpression(expression);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const selectedType = ANALYSIS_TYPES.find(type => type.analysis_type === analysisType);
      
      if (!selectedType) {
        throw new Error('Invalid analysis type selected');
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
          cron_expression: cronExpression,
          description,
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
      <div className="bg-[#25262b] p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Analytics Schedule</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Analysis Type</label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full p-2 bg-[#2c2d32] rounded-md border border-gray-700"
              required
            >
              <option value="">Select an analysis type</option>
              {ANALYSIS_TYPES.map((type) => (
                <option key={type.id} value={type.analysis_type}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Cron Expression</label>
              <button
                type="button"
                onClick={() => setShowCronHelp(!showCronHelp)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {showCronHelp ? 'Hide Examples' : 'Show Examples'}
              </button>
            </div>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full p-2 bg-[#2c2d32] rounded-md border border-gray-700"
              placeholder="e.g., 0 0 * * *"
              required
            />
            {showCronHelp && (
              <div className="mt-2 space-y-2 text-sm bg-[#2c2d32] p-3 rounded-md">
                <p className="text-gray-300 mb-2">Common examples (click to use):</p>
                {CRON_EXAMPLES.map((example) => (
                  <button
                    key={example.expression}
                    type="button"
                    onClick={() => handleCronExampleClick(example.expression)}
                    className="block w-full text-left px-2 py-1 hover:bg-[#35363c] rounded"
                  >
                    <span className="text-purple-400">{example.expression}</span>
                    <span className="text-gray-400 ml-2">- {example.description}</span>
                  </button>
                ))}
                <p className="text-gray-400 mt-2 text-xs">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-[#2c2d32] rounded-md border border-gray-700"
              rows={3}
              placeholder="Optional description of this schedule"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-[#2c2d32] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 