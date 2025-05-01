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
  color: string;
  icon: JSX.Element;
}

interface Day {
  value: string;
  label: string;
}

const ANALYSIS_TYPES: AnalysisType[] = [
  { 
    name: 'revenue_growth', 
    displayName: 'Revenue Growth', 
    description: 'Analyze revenue trends and growth opportunities',
    color: '#4CAF50',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  { 
    name: 'top_customers', 
    displayName: 'Top Customers', 
    description: 'Track the top customers of your store in the past 30 days',
    color: '#2196F3',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    name: 'financial_metrics', 
    displayName: 'Financial Metrics', 
    description: 'Track your store\'s financial metrics',
    color: '#FF9800',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    name: 'inventory', 
    displayName: 'Inventory', 
    description: 'Track your store\'s inventory',
    color: '#9C27B0',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    )
  },
  { 
    name: 'pricing_optimization', 
    displayName: 'Pricing Optimization', 
    description: 'Optimize pricing strategies for maximum profitability',
    color: '#F44336',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  },
  { 
    name: 'general_insights', 
    displayName: 'General Insights', 
    description: 'Get comprehensive business performance insights',
    color: '#00BCD4',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
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

const HOURS = [
  { value: 9, label: '9:00 AM' },
  { value: 11, label: '11:00 AM' },
  { value: 13, label: '1:00 PM' },
  { value: 15, label: '3:00 PM' }
];

// Helper function to convert local hour to UTC
const convertToUTC = (localHour: number, localDay: string): { hour: number, day: string } => {
  const now = new Date();
  const localDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (parseInt(localDay) - now.getDay()),
    localHour
  );
  
  const utcHour = localDate.getUTCHours();
  const utcDay = localDate.getUTCDay().toString();
  
  return { hour: utcHour, day: utcDay };
};

export default function ScheduleModal({ isOpen, onClose, onScheduleAdd }: ScheduleModalProps) {
  const [analysisType, setAnalysisType] = useState<string>('');
  const [day, setDay] = useState<string>('1'); // Default to Monday
  const [hour, setHour] = useState<number>(9); // Default to 9 AM
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const getCronExpression = (): string => {
    const { hour: utcHour, day: utcDay } = convertToUTC(hour, day);
    return `0 ${utcHour} * * ${utcDay}`;
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
          description: description.trim() || `${selectedType.displayName} - Weekly on ${DAYS.find(d => d.value === day)?.label} at ${HOURS.find(h => h.value === hour)?.label}`,
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
        description: description.trim() || `${selectedType.displayName} - Weekly on ${DAYS.find(d => d.value === day)?.label} at ${HOURS.find(h => h.value === hour)?.label}`,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#25262b] p-6 md:p-8 rounded-xl w-full max-w-3xl font-inter max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#2c2d32]"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-normal mb-6 text-white">Schedule Weekly Suggestion</h2>
        <p className="text-sm text-[#7B7B7B] mb-6">
          All times are shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-[40px] font-semibold text-white mb-8">Select your goals.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ANALYSIS_TYPES.map((type) => {
                const isSelected = analysisType === type.name;
                return (
                  <div
                    key={type.name}
                    className={`p-5 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-opacity-10 border-opacity-100'
                        : 'bg-[#2c2d32] hover:bg-[#32333a] border-transparent hover:border-[#3c3d42]'
                    }`}
                    style={{
                      borderColor: isSelected ? type.color : 'transparent',
                      backgroundColor: isSelected ? `${type.color}20` : '#2c2d32'
                    }}
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
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1" style={{ color: type.color }}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-lg mb-2`} style={{ color: isSelected ? type.color : 'white' }}>
                          {type.displayName}
                        </div>
                        <p className="text-sm text-[#9a9a9a] leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 ml-auto">
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
              className="px-6 py-2.5 text-white hover:bg-[#2c2d32] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !analysisType}
              className="px-8 py-2.5 bg-[#8C74FF] hover:bg-[#7B63EE] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 