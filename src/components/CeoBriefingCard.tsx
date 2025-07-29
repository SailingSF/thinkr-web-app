'use client';

import { Schedule } from '@/hooks/useLocalStorage';

interface CeoBriefingCardProps {
  schedule: Schedule;
  onEdit: () => void;
  onToggleActive: (newStatus: boolean) => void;
  isUpdating?: boolean;
}

// Helper function to convert UTC to local time for CEO briefing
const convertFromUTC = (utcHour: number): number => {
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    utcHour
  ));
  
  return utcDate.getHours();
};

// Format hour to AM/PM
const formatHourToAMPM = (hour: number): string => {
  return hour === 0 ? '12 AM' : 
    hour === 12 ? '12 PM' : 
    hour > 12 ? `${hour-12} PM` : 
    `${hour} AM`;
};

export default function CeoBriefingCard({ schedule, onEdit, onToggleActive, isUpdating }: CeoBriefingCardProps) {
  // Parse cron expression to get local time
  const [, utcHour] = schedule.cron_expression.split(' ');
  const localHour = convertFromUTC(parseInt(utcHour));
  const timeLabel = formatHourToAMPM(localHour);

  return (
    <div className="bg-[#141718] rounded-xl border border-[#8C74FF]/20 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Daily CEO Briefing</h2>
        <div className="flex items-center gap-4">
          {/* Toggle Switch */}
          <button
            onClick={() => onToggleActive(!schedule.is_active)}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8C74FF]/50 focus:ring-offset-2 focus:ring-offset-[#141718] ${schedule.is_active ? 'bg-green-500' : 'bg-[#2C2D32]'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`${schedule.is_active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out`}
            />
          </button>
          <div className="h-4 w-px bg-[#2C2D32]" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7B7B7B]">Time:</span>
            <span className="text-sm font-medium text-white">{timeLabel}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-[#2C2D32] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#7B7B7B]">
            Get a daily summary of your store's key metrics delivered to your email every weekday
          </p>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-[#8C74FF]/10 hover:bg-[#8C74FF]/20 text-[#8C74FF] rounded-lg transition-colors text-sm font-medium border border-[#8C74FF]/20 hover:border-[#8C74FF]/40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Edit Time
          </button>
        </div>
      </div>
    </div>
  );
}