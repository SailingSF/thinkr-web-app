'use client';

import { useState, useEffect } from 'react';
import { Schedule } from '@/hooks/useLocalStorage';

interface CeoBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  onSave: (newCron: string) => Promise<void>;
}

// Helper function to convert local time to UTC for cron expression
const convertToUTC = (localHour: number): number => {
  const now = new Date();
  const localDate = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), localHour, 0, 0
  );
  return localDate.getUTCHours();
};

// Helper function to convert UTC to local time
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

export default function CeoBriefingModal({ isOpen, onClose, schedule, onSave }: CeoBriefingModalProps) {
  const [selectedHour, setSelectedHour] = useState<number>(9); // Default to 9 AM
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize selected hour from current schedule
  useEffect(() => {
    if (schedule && isOpen) {
      const [, utcHour] = schedule.cron_expression.split(' ');
      const localHour = convertFromUTC(parseInt(utcHour));
      setSelectedHour(localHour);
    }
  }, [schedule, isOpen]);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Convert local time to UTC for cron expression
      const utcHour = convertToUTC(selectedHour);
      // CEO briefing is always Monday-Friday (1-5)
      const newCron = `0 ${utcHour} * * 1-5`;
      
      await onSave(newCron);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] rounded-2xl border border-[#2C2D32] w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Edit CEO Briefing Time</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-[#7B7B7B] hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Delivery Time (Monday - Friday)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                  <button
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      selectedHour === hour
                        ? 'bg-[#8C74FF] text-white border border-[#8C74FF]'
                        : 'bg-[#2C2D32] text-[#7B7B7B] hover:bg-[#3C3D42] hover:text-white border border-transparent'
                    }`}
                  >
                    {formatHourToAMPM(hour)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#2C2D32]/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-[#7B7B7B]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Time shown is in your local timezone. Emails are sent Monday through Friday only.</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#2C2D32] hover:bg-[#3C3D42] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#8C74FF] hover:bg-[#8C74FF]/90 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}