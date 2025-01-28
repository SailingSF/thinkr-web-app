'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ScheduleModal from './ScheduleModal';
import { useAuthFetch } from '@/utils/shopify';

interface Schedule {
  id: number;
  analysis_type: string;
  cron_expression: string;
  is_active: boolean;
  description: string;
  last_run: string | null;
  next_run: string | null;
}

interface SchedulesResponse {
  schedules: Schedule[];
}

export default function Scheduler() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;

    async function fetchSchedules() {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const schedulesResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`);
        if (!schedulesResponse.ok) {
          if (schedulesResponse.status === 401) {
            router.replace('/');
            return;
          }
          throw new Error('Failed to fetch schedules');
        }
        const schedulesData = await schedulesResponse.json() as SchedulesResponse;
        
        if (mountedRef.current) {
          setSchedules(schedulesData.schedules);
          setError('');
        }
      } catch (err) {
        console.error('Scheduler error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load scheduler data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    }

    fetchSchedules();

    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
    };
  }, [authFetch, router]);

  const handleScheduleAdd = async (newSchedule: Schedule) => {
    setSchedules(prev => [...prev, newSchedule]);
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    setIsDeletingSchedule(scheduleId);
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule_id: scheduleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete schedule');
      }

      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    } catch (error) {
      console.error('Delete schedule error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete schedule');
    } finally {
      setIsDeletingSchedule(null);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!window.confirm('Are you sure you want to delete all analysis schedules? This action cannot be undone.')) {
      return;
    }

    setIsDeletingAll(true);
    try {
      await Promise.all(
        schedules.map(schedule =>
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ schedule_id: schedule.id }),
          })
        )
      );

      setSchedules([]);
    } catch (error) {
      console.error('Unsubscribe all error:', error);
      setError('Failed to delete all schedules. Please try again.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-8 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-[#25262b] p-6 rounded-xl border border-purple-400/20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Email Scheduler</h1>
              <p className="text-gray-400 mt-1">Configure automated analysis reports for your store</p>
            </div>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
            >
              Add Schedule
            </button>
          </div>

          {schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map(schedule => {
                const [, hour, , , day] = schedule.cron_expression.split(' ');
                const dayLabel = {
                  '0': 'Sunday',
                  '1': 'Monday',
                  '2': 'Tuesday',
                  '3': 'Wednesday',
                  '4': 'Thursday',
                  '5': 'Friday',
                  '6': 'Saturday'
                }[day] || 'Unknown';
                
                const timeLabel = parseInt(hour) === 0 ? '12 AM' : 
                  parseInt(hour) === 12 ? '12 PM' : 
                  parseInt(hour) > 12 ? `${parseInt(hour)-12} PM` : 
                  `${hour} AM`;

                const analysisLabel = schedule.analysis_type
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');

                return (
                  <div
                    key={schedule.id}
                    className="p-4 bg-[#2c2d32] rounded-lg border border-purple-400/10 hover:border-purple-400/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-purple-400">
                            {analysisLabel}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            schedule.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {schedule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {schedule.description || `Weekly analysis on ${dayLabel} at ${timeLabel}`}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          {schedule.last_run && (
                            <p>Last run: {new Date(schedule.last_run).toLocaleString()}</p>
                          )}
                          {schedule.next_run && (
                            <p>Next run: {new Date(schedule.next_run).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-gray-400 bg-[#25262b] px-3 py-1 rounded-md">
                          {dayLabel}, {timeLabel}
                        </span>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={isDeletingSchedule === schedule.id}
                          className="text-sm text-red-400 hover:text-red-300 disabled:text-red-400/50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isDeletingSchedule === schedule.id ? 'Deleting...' : 'Delete Schedule'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {schedules.length > 0 && (
                <div className="mt-8 pt-6 border-t border-purple-400/20">
                  <button
                    onClick={handleUnsubscribeAll}
                    disabled={isDeletingAll}
                    className="w-full px-4 py-2 text-red-400 bg-red-400/10 hover:bg-red-400/20 disabled:bg-red-400/5 disabled:text-red-400/50 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    {isDeletingAll ? 'Unsubscribing...' : 'Unsubscribe from All Analyses'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No schedules yet</h3>
              <p className="text-gray-400 mb-6">
                Add your first analysis schedule to start receiving automated reports
              </p>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
              >
                Add Your First Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleAdd={handleScheduleAdd}
      />
    </div>
  );
} 