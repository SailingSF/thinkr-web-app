'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ScheduleModal from './ScheduleModal';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, Schedule } from '@/hooks/useLocalStorage';

interface SchedulesResponse {
  schedules: Schedule[];
}

type ViewMode = 'list' | 'weekly';

export default function Scheduler() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData, isExpired } = useLocalStorage();
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const [schedules, setSchedules] = useState<Schedule[]>(storedData?.schedules || []);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [loading, setLoading] = useState(!storedData?.schedules);
  const [error, setError] = useState('');
  const [hideWeekends, setHideWeekends] = useState(false);

  const hasWeekendSchedules = useMemo(() => {
    return schedules.some(schedule => {
      const [, , , , day] = schedule.cron_expression.split(' ');
      const dayNum = parseInt(day);
      return dayNum === 6 || dayNum === 0; // Saturday is 6, Sunday is 0
    });
  }, [schedules]);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchSchedules() {
      if (fetchingRef.current || initialLoadDoneRef.current) return;
      
      if (!isExpired && storedData?.schedules) {
        setSchedules(storedData.schedules);
        setLoading(false);
        initialLoadDoneRef.current = true;
        return;
      }

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
          updateStoredData({ schedules: schedulesData.schedules });
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
          initialLoadDoneRef.current = true;
        }
        fetchingRef.current = false;
      }
    }

    fetchSchedules();

    return () => {
      mountedRef.current = false;
    };
  }, [authFetch, router, isExpired]);

  useEffect(() => {
    if (viewMode === 'weekly') {
      setTimeout(() => {
        const eightAMElement = document.getElementById('hour-8');
        if (eightAMElement) {
          eightAMElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      }, 100);
    }
  }, [viewMode]);

  const handleScheduleAdd = async (newSchedule: Schedule) => {
    setSchedules(prev => {
      const updated = [...prev, newSchedule];
      updateStoredData({ schedules: updated });
      return updated;
    });
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

      setSchedules(prev => {
        const updated = prev.filter(s => s.id !== scheduleId);
        updateStoredData({ schedules: updated });
        return updated;
      });
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
      updateStoredData({ schedules: [] });
    } catch (error) {
      console.error('Unsubscribe all error:', error);
      setError('Failed to delete all schedules. Please try again.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const renderWeeklyView = () => {
    const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDays = hideWeekends ? allWeekDays.slice(0, 5) : allWeekDays;
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const timeZoneAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(part => part.type === 'timeZoneName')?.value || 'Local';

    return (
      <div className="mt-4">
        <div className="overflow-auto max-h-[calc(100vh-300px)] rounded-lg [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
          <div className="min-w-[900px] relative">
            {/* Time Column Headers - Made sticky */}
            <div className={`grid ${hideWeekends ? 'grid-cols-6' : 'grid-cols-8'} gap-4 mb-4 sticky top-0 z-10 bg-[#141718] pt-4 pb-2 shadow-md border-b border-[#2C2D32]`}>
              <div className="text-[#7B7B7B] text-sm">{timeZoneAbbr}</div>
              {weekDays.map(day => (
                <div key={day} className="text-[#7B7B7B] text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  id={`hour-${hour}`}
                  className={`grid ${hideWeekends ? 'grid-cols-6' : 'grid-cols-8'} gap-4 ${hour !== 0 ? 'border-t border-[#2C2D32]' : ''} py-4`}
                >
                  <div className="text-[#7B7B7B]/80 text-sm sticky left-0 bg-[#141718] z-[5] px-2">
                    {hour === 0 ? '12 AM' : 
                     hour === 12 ? '12 PM' : 
                     hour > 12 ? `${hour-12} PM` : 
                     `${hour} AM`}
                  </div>
                  {weekDays.map(day => (
                    <div key={`${day}-${hour}`} className="min-h-[60px] relative">
                      {schedules.map(schedule => {
                        const [, scheduleHour, , , scheduleDay] = schedule.cron_expression.split(' ');
                        const dayIndex = parseInt(scheduleDay);
                        if (parseInt(scheduleHour) === hour && weekDays[dayIndex - 1] === day) {
                          const timeLabel = hour === 0 ? '12 AM' : 
                            hour === 12 ? '12 PM' : 
                            hour > 12 ? `${hour-12} PM` : 
                            `${hour} AM`;
                          const analysisLabel = schedule.analysis_type
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                          return (
                            <div
                              key={schedule.id}
                              className="absolute inset-x-0 bg-[#8C74FF]/10 rounded-lg p-3 border border-[#8C74FF]/20 hover:border-[#8C74FF]/40 transition-colors group"
                            >
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                disabled={isDeletingSchedule === schedule.id}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#141718] border border-red-400 flex items-center justify-center text-red-400 hover:text-red-300 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm font-medium text-[#8C74FF]">
                                    {analysisLabel}
                                  </h3>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    schedule.is_active 
                                      ? 'bg-[#22C55E]/10 text-[#22C55E] ring-1 ring-[#22C55E]/20' 
                                      : 'bg-[#7B7B7B]/10 text-[#7B7B7B] ring-1 ring-[#7B7B7B]/20'
                                  }`}>
                                    {schedule.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-[#7B7B7B] leading-relaxed">
                                  {schedule.description || `${analysisLabel} Analysis`}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#242424]">
        <div className="text-xl text-[#8C74FF] flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] py-8 lg:py-12 font-inter">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Title Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-[35px] text-[#FFFFFF] font-normal m-0">
              Analysis Scheduler
            </h1>
            <p className="text-[#8C74FF] text-[25px] font-normal m-0">
              Schedule automated analysis for your store.
            </p>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="mt-4 lg:mt-0 w-full lg:w-auto px-6 py-3 bg-[#8C74FF] hover:bg-[#8C74FF]/90 rounded-lg transition-all duration-200 text-base font-medium text-white shadow-md shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30"
          >
            Add Schedule
          </button>
        </div>

        {error && (
          <div className="mb-6 lg:mb-8 p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-[#141718] rounded-2xl">
          <div className="mt-8">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setViewMode('list')}
                  className={`text-lg font-semibold transition-colors ${
                    viewMode === 'list' ? 'text-white' : 'text-[#7B7B7B] hover:text-white'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`text-lg font-semibold transition-colors ${
                    viewMode === 'weekly' ? 'text-white' : 'text-[#7B7B7B] hover:text-white'
                  }`}
                >
                  Weekly View
                </button>
              </div>
              {viewMode === 'weekly' && (
                <div className="flex items-center gap-3" title={hasWeekendSchedules ? "Can't hide weekends when schedules exist on weekends" : "Toggle weekend visibility"}>
                  <span className="text-sm text-[#7B7B7B]">Show Weekends</span>
                  <button
                    onClick={() => setHideWeekends(!hideWeekends)}
                    disabled={hasWeekendSchedules}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#338452]/50 focus:ring-offset-2 focus:ring-offset-[#141718] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: hideWeekends ? '#282C2D' : '#338452' }}
                  >
                    <span
                      className={`${
                        hideWeekends ? 'translate-x-1' : 'translate-x-6'
                      } inline-block h-4 w-4 transform rounded-full bg-[#1C1C1C] shadow-lg transition duration-200 ease-in-out`}
                    />
                  </button>
                  {hasWeekendSchedules && (
                    <span className="text-xs bg-[#2C2D32] px-2 py-0.5 rounded text-[#7B7B7B]">
                      Weekend schedules exist
                    </span>
                  )}
                </div>
              )}
            </div>

            {viewMode === 'list' ? (
              <div className="space-y-4">
                {schedules.length > 0 ? (
                  <div className="space-y-4">
                    {schedules.map((schedule) => {
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
                          className="p-4 lg:p-5 bg-[#141718] rounded-xl border border-[#8C74FF]/10 hover:border-[#8C74FF]/30 transition-all duration-200"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-semibold text-[#8C74FF] text-base lg:text-lg">
                                  {analysisLabel}
                                </h3>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  schedule.is_active 
                                    ? 'bg-[#22C55E]/10 text-[#22C55E] ring-1 ring-[#22C55E]/20' 
                                    : 'bg-[#7B7B7B]/10 text-[#7B7B7B] ring-1 ring-[#7B7B7B]/20'
                                }`}>
                                  {schedule.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-sm text-[#7B7B7B] leading-relaxed">
                                {schedule.description || `Weekly analysis on ${dayLabel} at ${timeLabel}`}
                              </p>
                              <div className="text-xs space-y-2 text-[#7B7B7B]/80">
                                {schedule.last_run && (
                                  <p className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#7B7B7B]/30"></span>
                                    Last run: {new Date(schedule.last_run).toLocaleString()}
                                  </p>
                                )}
                                {schedule.next_run && (
                                  <p className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#8C74FF]/30"></span>
                                    Next run: {new Date(schedule.next_run).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3">
                              <span className="text-sm text-[#7B7B7B] whitespace-nowrap">
                                {dayLabel}, {timeLabel}
                              </span>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                disabled={isDeletingSchedule === schedule.id}
                                className="text-sm text-red-400 hover:text-red-300 disabled:text-red-400/50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                              >
                                {isDeletingSchedule === schedule.id ? 'Deleting...' : 'Delete Schedule'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-8 pt-8 border-t border-[#8C74FF]/10 flex justify-center">
                      <button
                        onClick={handleUnsubscribeAll}
                        disabled={isDeletingAll}
                        className="w-full lg:w-auto px-6 py-2.5 text-red-400 bg-red-400/5 hover:bg-red-400/10 disabled:bg-red-400/5 disabled:text-red-400/50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 text-sm font-medium ring-1 ring-red-400/20"
                      >
                        {isDeletingAll ? 'Unsubscribing...' : 'Unsubscribe from All Analyses'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 lg:py-16 px-4">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#8C74FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#8C74FF]/20">
                      <svg className="w-8 h-8 lg:w-10 lg:h-10 text-[#8C74FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">No schedules yet</h3>
                    <p className="text-base text-[#7B7B7B] mb-8 max-w-md mx-auto">
                      Add your first analysis schedule to start receiving automated reports
                    </p>
                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="px-8 py-3 bg-[#8C74FF] hover:bg-[#8C74FF]/90 rounded-lg transition-all duration-200 text-base font-medium text-white shadow-md shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30"
                    >
                      Add Schedule
                    </button>
                  </div>
                )}
              </div>
            ) : (
              renderWeeklyView()
            )}
          </div>
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