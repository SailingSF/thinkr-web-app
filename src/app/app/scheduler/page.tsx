'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ScheduleModal from './ScheduleModal';
import AlertModal from './AlertModal';
import CeoBriefingCard from '@/components/CeoBriefingCard';
import CeoBriefingModal from '@/components/CeoBriefingModal';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, Schedule, Alert, UsageStatus, CustomReport } from '@/hooks/useLocalStorage';
import CustomReportCard from '@/components/CustomReportCard';

interface SchedulesResponse {
  schedules: Schedule[];
  custom_reports?: CustomReport[];
}

interface AlertsResponse {
  results: Alert[];
  count: number;
  next: string | null;
  previous: string | null;
}

type ViewMode = 'list' | 'weekly' | 'kanban';
type Section = 'schedules' | 'alerts';

// Helper function to convert UTC to local time
const convertFromUTC = (utcHour: number, utcDay: string): { hour: number, day: string } => {
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (parseInt(utcDay) - now.getUTCDay()),
    utcHour
  ));
  
  const localHour = utcDate.getHours();
  const localDay = utcDate.getDay().toString();
  
  return { hour: localHour, day: localDay };
};

// Format analysis_type from snake_case to Title Case
const formatAnalysisType = (analysisType: string): string => {
  return analysisType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format metric type for display
const formatMetricType = (metric: string): string => {
  return metric
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get metric color based on type
const getMetricColor = (metric: string): string => {
  const colors: Record<string, string> = {
    'inventory_level': '#FF9800',
    'orders_count': '#2196F3',
    'revenue': '#4CAF50',
    'customer_count': '#9C27B0'
  };
  return colors[metric] || '#8C74FF';
};

// Format threshold display
const formatThreshold = (alert: Alert): string => {
  const condition = alert.threshold_type === 'gt' ? '>' : '<';
  const unit = alert.metric === 'revenue' ? '$' : '';
  return `${condition} ${unit}${alert.threshold_value}`;
};

// Day mapping for consistent usage
const DAY_LABELS: Record<string, string> = {
  '0': 'Sunday',
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday'
};

// Format hour to AM/PM
const formatHourToAMPM = (hour: number): string => {
  return hour === 0 ? '12 AM' : 
    hour === 12 ? '12 PM' : 
    hour > 12 ? `${hour-12} PM` : 
    `${hour} AM`;
};

export default function Scheduler() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData, isExpired } = useLocalStorage();
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const [schedules, setSchedules] = useState<Schedule[]>(storedData?.schedules || []);
  const [alerts, setAlerts] = useState<Alert[]>(storedData?.alerts || []);
  const [customReports, setCustomReports] = useState<CustomReport[]>(storedData?.customReports || []);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(storedData?.usageStatus || null);
  const [activeSection, setActiveSection] = useState<Section>('schedules');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState<number | null>(null);
  const [isDeletingAlert, setIsDeletingAlert] = useState<number | null>(null);
  const [isDeletingCustomReport, setIsDeletingCustomReport] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isTogglingCeo, setIsTogglingCeo] = useState(false);
  const [loading, setLoading] = useState(!storedData?.schedules && !storedData?.alerts);
  const [error, setError] = useState('');
  const [hideWeekends, setHideWeekends] = useState(false);
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Set<string>>(new Set());
  const [showAllHours, setShowAllHours] = useState(false);
  const [alertSearch, setAlertSearch] = useState('');
  const [isCeoModalOpen, setIsCeoModalOpen] = useState(false);
  // Custom reports are designed for single-report scenarios; no filters/sort

  // Ensure alerts is always an array and filter out deactivated alerts
  const safeAlerts = (alerts || []).filter(alert => alert.is_active);
  const safeSchedules = schedules || [];
  
  // Separate CEO briefing from other schedules
  const ceoSchedule = safeSchedules.find(schedule => schedule.analysis_type === 'ceo_briefing') || null;
  const otherSchedules = safeSchedules.filter(schedule => schedule.analysis_type !== 'ceo_briefing');
  
  // Ensure usageStatus has safe nested properties
  const safeUsageStatus = usageStatus && usageStatus.alerts ? usageStatus : null;

  const hasWeekendSchedules = useMemo(() => {
    return otherSchedules.some(schedule => {
      const [, , , , day] = schedule.cron_expression.split(' ');
      const dayNum = parseInt(day);
      return dayNum === 6 || dayNum === 0; // Saturday is 6, Sunday is 0
    });
  }, [otherSchedules]);

  // Reset expanded state when view mode changes
  useEffect(() => {
    setExpandedTimeSlots(new Set());
  }, [viewMode]);

  // Reset expanded state when navigating away
  useEffect(() => {
    return () => {
      setExpandedTimeSlots(new Set());
    };
  }, []);

  const timeZoneAbbr = useMemo(() => {
    return new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(part => part.type === 'timeZoneName')?.value || 'Local';
  }, []);

  // Memoize the format function for better performance
  const formatScheduleTime = useCallback((schedule: Schedule) => {
    const [, utcHour, , , utcDay] = schedule.cron_expression.split(' ');
    const { hour: localHour, day: localDay } = convertFromUTC(parseInt(utcHour), utcDay);
    
    const dayLabel = DAY_LABELS[localDay] || 'Unknown';
    const timeLabel = formatHourToAMPM(localHour);

    return { dayLabel, timeLabel, hour: localHour };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchSchedules() {
      if (fetchingRef.current || initialLoadDoneRef.current) return;
      
      if (!isExpired && storedData?.schedules) {
        setSchedules(storedData.schedules || []);
        setAlerts(storedData.alerts || []);
        setUsageStatus(storedData.usageStatus || null);
        setCustomReports(storedData.customReports || []);
        setLoading(false);
        initialLoadDoneRef.current = true;
        return;
      }

      fetchingRef.current = true;

      try {
        // Fetch schedules
        const schedulesResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`);
        if (!schedulesResponse.ok) {
          if (schedulesResponse.status === 401) {
            router.replace('/');
            return;
          }
          throw new Error('Failed to fetch schedules');
        }
        const schedulesData = await schedulesResponse.json() as SchedulesResponse;

        // Fetch alerts
        const alertsResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/`);
        let alertsData: Alert[] = [];
        if (alertsResponse.ok) {
          const alertsResponseData = await alertsResponse.json();
          // Handle both paginated response and direct array response
          if (Array.isArray(alertsResponseData)) {
            // Direct array response
            alertsData = alertsResponseData;
          } else if (alertsResponseData.results && Array.isArray(alertsResponseData.results)) {
            // Paginated response
            alertsData = alertsResponseData.results;
          }
        }

        // Fetch usage status
        const usageResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/usage-status/`);
        let usageData: UsageStatus | null = null;
        if (usageResponse.ok) {
          const rawUsageData = await usageResponse.json();
          // Transform the API response to match our expected structure
          if (rawUsageData.usage && rawUsageData.usage.alert) {
            usageData = {
              alerts: {
                used: rawUsageData.usage.alert.current,
                limit: rawUsageData.usage.alert.limit,
                percentage: rawUsageData.usage.alert.percentage
              }
            };
          }
        }
        
        if (mountedRef.current) {
          setSchedules(schedulesData.schedules || []);
          setAlerts(alertsData || []);
          setUsageStatus(usageData || null);
          setCustomReports(schedulesData.custom_reports || []);
          updateStoredData({ 
            schedules: schedulesData.schedules || [],
            alerts: alertsData || [],
            usageStatus: usageData || null,
            customReports: schedulesData.custom_reports || []
          });
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

  const handleAlertAdd = async (newAlert: Alert) => {
    setAlerts(prev => {
      const prevArray = prev || [];
      const updated = [...prevArray, newAlert];
      updateStoredData({ alerts: updated });
      return updated;
    });
    // Refresh usage status after adding an alert
    try {
      const usageResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/usage-status/`);
      if (usageResponse.ok) {
        const rawUsageData = await usageResponse.json();
        if (rawUsageData.usage && rawUsageData.usage.alert) {
          const usageData = {
            alerts: {
              used: rawUsageData.usage.alert.current,
              limit: rawUsageData.usage.alert.limit,
              percentage: rawUsageData.usage.alert.percentage
            }
          };
          setUsageStatus(usageData);
          updateStoredData({ usageStatus: usageData });
        }
      }
    } catch (error) {
      console.error('Failed to refresh usage status:', error);
    }
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

  const handleUpdateCeoSchedule = async (newCron: string) => {
    if (!ceoSchedule) {
      throw new Error('CEO briefing schedule not found');
    }

    const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schedule_id: ceoSchedule.id,
        cron_expression: newCron,
        is_active: ceoSchedule.is_active
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update CEO briefing schedule');
    }

    const updatedScheduleData = await response.json();
    
    // Update the schedule in state
    setSchedules(prev => {
      const updated = prev.map(schedule => 
        schedule.id === ceoSchedule.id 
          ? { ...schedule, cron_expression: newCron, next_run: updatedScheduleData.next_run }
          : schedule
      );
      updateStoredData({ schedules: updated });
      return updated;
    });
  };

  const handleDeleteAlert = async (alertId: number) => {
    setIsDeletingAlert(alertId);
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/${alertId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete alert');
      }

      setAlerts(prev => {
        const prevArray = prev || [];
        const updated = prevArray.filter(a => a.id !== alertId);
        updateStoredData({ alerts: updated });
        return updated;
      });

      // Refresh usage status after deleting an alert
      try {
        const usageResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/usage-status/`);
        if (usageResponse.ok) {
          const rawUsageData = await usageResponse.json();
          if (rawUsageData.usage && rawUsageData.usage.alert) {
            const usageData = {
              alerts: {
                used: rawUsageData.usage.alert.current,
                limit: rawUsageData.usage.alert.limit,
                percentage: rawUsageData.usage.alert.percentage
              }
            };
            setUsageStatus(usageData);
            updateStoredData({ usageStatus: usageData });
          }
        }
      } catch (error) {
        console.error('Failed to refresh usage status:', error);
      }
    } catch (error) {
      console.error('Delete alert error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete alert');
    } finally {
      setIsDeletingAlert(null);
    }
  };

  const handleDeleteCustomReport = async (reportId: string) => {
    if (!window.confirm('Delete this custom report schedule? This cannot be undone.')) return;
    setIsDeletingCustomReport(reportId);
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-reports/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report_id: reportId }),
      });

      if (!response.ok) {
        let message = 'Failed to delete custom report';
        try {
          const err = await response.json();
          message = err.error || err.detail || message;
        } catch {}
        throw new Error(message);
      }

      setCustomReports(prev => {
        const updated = (prev || []).filter(r => r.id !== reportId);
        updateStoredData({ customReports: updated });
        return updated;
      });
      setError('');
    } catch (err) {
      console.error('Delete custom report error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete custom report');
    } finally {
      setIsDeletingCustomReport(null);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!window.confirm('Are you sure you want to delete all analysis schedules? This action cannot be undone.')) {
      return;
    }

    setIsDeletingAll(true);
    try {
      await Promise.all(
        otherSchedules.map(schedule =>
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ schedule_id: schedule.id }),
          })
        )
      );

      // Keep CEO briefing, remove only other schedules
      const updatedSchedules = ceoSchedule ? [ceoSchedule] : [];
      setSchedules(updatedSchedules);
      updateStoredData({ schedules: updatedSchedules });
    } catch (error) {
      console.error('Unsubscribe all error:', error);
      setError('Failed to delete all schedules. Please try again.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleToggleCeoActive = async (newIsActive: boolean) => {
    if (!ceoSchedule) return;
    setIsTogglingCeo(true);
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis-schedules/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule_id: ceoSchedule.id,
          is_active: newIsActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update CEO briefing status');
      }

      const updatedData = await response.json();

      setSchedules(prev => {
        const updated = prev.map(schedule =>
          schedule.id === ceoSchedule.id
            ? { ...schedule, is_active: newIsActive, next_run: updatedData.next_run }
            : schedule
        );
        updateStoredData({ schedules: updated });
        return updated;
      });
      setError('');
    } catch (error) {
      console.error('Toggle CEO schedule error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update CEO briefing status');
    } finally {
      setIsTogglingCeo(false);
    }
  };

  const renderAlertsView = () => {
    return (
      <div className="space-y-4">
        {safeAlerts.length > 0 ? (
          <div className="space-y-4">
            {safeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 lg:p-5 bg-[#141718] rounded-xl border border-[#8C74FF]/10 hover:border-[#8C74FF]/30 transition-all duration-200"
                style={{ borderColor: `${getMetricColor(alert.metric)}20` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getMetricColor(alert.metric) }}
                        />
                        <h3 className="font-semibold text-white">
                          {alert.name}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#7B7B7B]">
                      <span className="flex items-center gap-1">
                        <span style={{ color: getMetricColor(alert.metric) }}>
                          {formatMetricType(alert.metric)}
                        </span>
                        {formatThreshold(alert)}
                      </span>
                      <span className="capitalize">{alert.frequency}</span>
                    </div>

                    {alert.instructions && (
                      <p className="text-sm text-[#7B7B7B] leading-relaxed">
                        {alert.instructions}
                      </p>
                    )}
                    
                    <div className="text-xs space-y-2 text-[#7B7B7B]/80">
                      {alert.last_evaluated && (
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#7B7B7B]/30"></span>
                          Last checked: {new Date(alert.last_evaluated).toLocaleString()}
                        </p>
                      )}
                      {alert.last_triggered && (
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#F44336]/50"></span>
                          Last triggered: {new Date(alert.last_triggered).toLocaleString()}
                        </p>
                      )}
                      {alert.next_run && (
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `${getMetricColor(alert.metric)}50` }}></span>
                          Next check: {new Date(alert.next_run).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3">
                    <div className="text-sm text-[#7B7B7B] text-right">
                      <div>Created {new Date(alert.created_at).toLocaleDateString()}</div>
                      {alert.updated_at !== alert.created_at && (
                        <div className="text-xs">Updated {new Date(alert.updated_at).toLocaleDateString()}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={isDeletingAlert === alert.id}
                      className="text-sm text-red-400 hover:text-red-300 disabled:text-red-400/50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {isDeletingAlert === alert.id ? 'Deleting...' : 'Delete Alert'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-8 pt-8 border-t border-[#8C74FF]/10 flex justify-center">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all alerts? This action cannot be undone.')) {
                    Promise.all(safeAlerts.map(alert => handleDeleteAlert(alert.id)));
                  }
                }}
                disabled={isDeletingAll}
                className="w-full lg:w-auto px-6 py-2.5 text-red-400 bg-red-400/5 hover:bg-red-400/10 disabled:bg-red-400/5 disabled:text-red-400/50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 text-sm font-medium ring-1 ring-red-400/20"
              >
                {isDeletingAll ? 'Deleting...' : 'Delete All Alerts'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 lg:py-16 px-4">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#8C74FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#8C74FF]/20">
              <svg className="w-8 h-8 lg:w-10 lg:h-10 text-[#8C74FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
              </svg>
            </div>
            <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">No alerts yet</h3>
            <p className="text-base text-[#7B7B7B] mb-8 max-w-md mx-auto">
              Create your first alert agent to monitor your store&apos;s performance and get notified when thresholds are met
            </p>
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-8 py-3 bg-[#8C74FF] hover:bg-[#8C74FF]/90 rounded-lg transition-all duration-200 text-base font-medium text-white shadow-md shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30"
            >
              Create Alert
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderWeeklyView = () => {
    const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDays = hideWeekends ? allWeekDays.slice(0, 5) : allWeekDays;
    // Only show business hours by default (6 AM to 10 PM) unless user wants to see all hours
    const defaultHours = showAllHours 
      ? Array.from({ length: 24 }, (_, i) => i) 
      : Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

    // Check if any schedules fall outside the default hours
    const hasSchedulesOutsideDefaultHours = !showAllHours && otherSchedules.some(schedule => {
      const { hour } = formatScheduleTime(schedule);
      return hour < 6 || hour > 22;
    });

    const toggleTimeSlot = (slotKey: string) => {
      setExpandedTimeSlots(prev => {
        // Create new Set only when actually changing the state
        if (prev.has(slotKey)) {
          const newSet = new Set(prev);
          newSet.delete(slotKey);
          return newSet;
        } else {
          const newSet = new Set(prev);
          newSet.add(slotKey);
          return newSet;
        }
      });
    };

    return (
      <div className="mt-4">
        <div className="overflow-auto max-h-[calc(100vh-400px)] rounded-lg [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
          <div className="min-w-[900px] relative">
            <div className={`grid ${hideWeekends ? 'grid-cols-6' : 'grid-cols-8'} gap-4 mb-4 sticky top-0 z-10 bg-[#141718] pt-4 pb-2 shadow-md border-b border-[#2C2D32]`}>
              <div className="text-[#7B7B7B] text-sm">
                {timeZoneAbbr}
              </div>
              {weekDays.map(day => (
                <div key={day} className="text-[#7B7B7B] text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            <div className="relative">
              {defaultHours.map(hour => (
                <div 
                  key={hour} 
                  id={`hour-${hour}`}
                  className={`grid ${hideWeekends ? 'grid-cols-6' : 'grid-cols-8'} gap-4 ${hour !== (showAllHours ? 0 : 6) ? 'border-t border-[#2C2D32]' : ''} py-4`}
                >
                  <div className="text-[#7B7B7B]/80 text-sm sticky left-0 bg-[#141718] z-[5] px-2">
                    {formatHourToAMPM(hour)}
                  </div>
                  {weekDays.map(day => {
                    const schedulesForTimeSlot = otherSchedules.filter(schedule => {
                      const { dayLabel, hour: localHour } = formatScheduleTime(schedule);
                      return localHour === hour && dayLabel === day;
                    });

                    if (schedulesForTimeSlot.length === 0) return <div key={`${day}-${hour}`} className="min-h-[60px] relative" />;

                    const slotKey = `${day}-${hour}`;
                    const isExpanded = expandedTimeSlots.has(slotKey);

                    return (
                      <div key={slotKey} className="min-h-[60px] relative">
                        {schedulesForTimeSlot.length === 1 ? (
                          // Single schedule view
                          <div className="inset-x-0 bg-[#8C74FF]/10 rounded-lg p-3 border border-[#8C74FF]/20 hover:border-[#8C74FF]/40 transition-colors group relative">
                            <button
                              onClick={() => handleDeleteSchedule(schedulesForTimeSlot[0].id)}
                              disabled={isDeletingSchedule === schedulesForTimeSlot[0].id}
                              className="absolute -top-2 -right-2 text-red-400 hover:text-red-300 disabled:text-red-400/50 disabled:cursor-not-allowed w-5 h-5 rounded-full bg-red-400/20 flex items-center justify-center transition-colors shadow-sm hover:shadow-md ring-1 ring-red-400/30"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="space-y-2 pt-1">
                              <h3 className="text-sm font-medium text-[#8C74FF]">
                                {formatAnalysisType(schedulesForTimeSlot[0].analysis_type)}
                              </h3>
                              <p className="text-xs text-[#7B7B7B] leading-relaxed">
                                {schedulesForTimeSlot[0].description || `${formatAnalysisType(schedulesForTimeSlot[0].analysis_type)} Analysis`}
                              </p>
                              <div className="flex justify-end">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  schedulesForTimeSlot[0].is_active 
                                    ? 'bg-[#22C55E]/10 text-[#22C55E] ring-1 ring-[#22C55E]/20' 
                                    : 'bg-[#7B7B7B]/10 text-[#7B7B7B] ring-1 ring-[#7B7B7B]/20'
                                }`}>
                                  {schedulesForTimeSlot[0].is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Multiple schedules view
                          <div className="absolute inset-x-0">
                            <button
                              onClick={() => toggleTimeSlot(slotKey)}
                              className="w-full bg-[#8C74FF]/10 rounded-lg p-3 border border-[#8C74FF]/20 hover:border-[#8C74FF]/40 transition-colors text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#8C74FF]">
                                  {schedulesForTimeSlot.length} Schedules
                                </span>
                                <svg
                                  className={`w-4 h-4 text-[#8C74FF] transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="absolute inset-x-0 top-full mt-1 z-10 bg-[#1C1C1E] rounded-lg border border-[#2C2D32] shadow-lg overflow-hidden p-2 space-y-2">
                                {schedulesForTimeSlot.map((schedule, index) => (
                                  <div
                                    key={schedule.id}
                                    className={`p-3 bg-[#8C74FF]/10 rounded-lg relative ${index !== 0 ? 'mt-2' : ''}`}
                                  >
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                      <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <h3 className="font-semibold text-[#8C74FF] text-base lg:text-lg">
                                            {formatAnalysisType(schedule.analysis_type)}
                                          </h3>
                                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            schedule.is_active 
                                              ? 'bg-[#22C55E]/10 text-[#22C55E] ring-1 ring-[#22C55E]/20' 
                                              : 'bg-[#7B7B7B]/10 text-[#7B7B7B] ring-1 ring-[#7B7B7B]/20'
                                          }`}>
                                            {schedule.is_active ? 'Active' : 'Inactive'}
                                          </span>
                                        </div>
                                        <div className="text-sm text-[#7B7B7B] whitespace-nowrap mt-2">
                                          {formatScheduleTime(schedule).dayLabel}, {formatScheduleTime(schedule).timeLabel}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSchedule(schedule.id);
                                      }}
                                      disabled={isDeletingSchedule === schedule.id}
                                      className="absolute -top-1.5 -right-1.5 text-red-400 hover:text-red-300 disabled:text-red-400/50 disabled:cursor-not-allowed w-5 h-5 rounded-full bg-red-400/20 flex items-center justify-center transition-colors shadow-sm hover:shadow-md ring-1 ring-red-400/30"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {hasSchedulesOutsideDefaultHours && !showAllHours && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllHours(true)}
                    className="text-sm text-[#8C74FF] hover:text-[#9C84FF] transition-colors"
                  >
                    Show all hours (some schedules are outside business hours)
                  </button>
                </div>
              )}

              {showAllHours && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllHours(false)}
                    className="text-sm text-[#8C74FF] hover:text-[#9C84FF] transition-colors"
                  >
                    Show only business hours (6 AM - 10 PM)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderKanbanView = () => {
    const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDays = hideWeekends ? allWeekDays.slice(0, 5) : allWeekDays;
    const schedulesByDay = weekDays.reduce((acc, day) => {
      acc[day] = otherSchedules.filter(schedule => {
        const { dayLabel } = formatScheduleTime(schedule);
        return dayLabel === day;
      });
      return acc;
    }, {} as Record<string, Schedule[]>);

    return (
      <div className="mt-4">
        <div className="overflow-auto max-h-[calc(100vh-400px)] rounded-lg [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2C2D32]/20 [&::-webkit-scrollbar-thumb]:bg-[#2C2D32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3C3D42] scrollbar-thin scrollbar-track-[#2C2D32]/20 scrollbar-thumb-[#2C2D32] hover:scrollbar-thumb-[#3C3D42]">
          <div className="min-w-[900px] relative">
            <div className={`grid ${hideWeekends ? 'grid-cols-5' : 'grid-cols-7'} gap-4 sticky top-0 z-10 bg-[#141718] pt-4 pb-2 shadow-md border-b border-[#2C2D32]`}>
              {weekDays.map(day => (
                <div key={day} className="text-[#7B7B7B] text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            <div className={`grid ${hideWeekends ? 'grid-cols-5' : 'grid-cols-7'} gap-4 pt-4`}>
              {weekDays.map(day => (
                <div key={day} className="space-y-4">
                  {schedulesByDay[day].map(schedule => {
                    const [, hour] = schedule.cron_expression.split(' ');
                    const timeLabel = formatHourToAMPM(parseInt(hour));
                    const analysisLabel = formatAnalysisType(schedule.analysis_type);

                    return (
                      <div
                        key={schedule.id}
                        className="bg-[#8C74FF]/10 rounded-lg p-3 border border-[#8C74FF]/20 hover:border-[#8C74FF]/40 transition-colors relative"
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
                            <div className="text-sm text-[#7B7B7B] whitespace-nowrap mt-2">
                              {formatScheduleTime(schedule).dayLabel}, {formatScheduleTime(schedule).timeLabel}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={isDeletingSchedule === schedule.id}
                          className="absolute -top-2 -right-2 text-gray-200/90 hover:text-red-300 disabled:text-red-600 disabled:cursor-not-allowed w-5 h-5 rounded-full bg-red-500/50 flex items-center justify-center transition-colors shadow-sm hover:shadow-md ring-1 ring-red-400/30"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
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
      <div className="flex items-center justify-center h-full">
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
    <div className="min-h-[calc(100vh-64px)] bg-[#141718] pt-0 px-2 sm:px-4 md:px-8 lg:px-10 font-inter overflow-x-hidden">
      <div className="w-full px-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-[35px] text-white font-light mb-2 mt-0">
          Agents
        </h1>
        <button
          className="mt-2 sm:mt-0 px-6 py-2 bg-[#8C74FF] hover:bg-[#7B5FFF] text-white rounded-lg font-semibold shadow transition-all duration-200 text-base"
          onClick={() => router.push('/app')}
        >
          <span className="mr-2 text-lg font-bold align-middle">+</span> Create Agent
        </button>
      </div>
      <div className="mb-4">
        <div className="flex items-start mb-4">
          <div className="flex-1">
          </div>
          <div className="flex gap-3 mt-2">
            {activeSection === 'alerts' && (
              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="px-6 py-3 bg-[#FF9800] hover:bg-[#FF9800]/90 rounded-lg transition-all duration-200 text-base font-medium text-white shadow-md shadow-[#FF9800]/20 hover:shadow-lg hover:shadow-[#FF9800]/30"
              >
                Create Alert
              </button>
            )}
            {activeSection === 'schedules' && null}
          </div>
        </div>
        <hr className="border-t border-white mb-4" />
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shadow-sm">
          {error}
        </div>
      )}

      {/* CEO Briefing Section */}
      {ceoSchedule && (
        <CeoBriefingCard 
          schedule={ceoSchedule} 
          onEdit={() => setIsCeoModalOpen(true)} 
          onToggleActive={handleToggleCeoActive}
          isUpdating={isTogglingCeo}
        />
      )}

      <div className="bg-[#141718] rounded-2xl p-6 shadow-lg">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-light text-white flex items-center gap-2 mb-0">
            Reporting Schedules
            {otherSchedules.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full">
                {otherSchedules.length}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center justify-between mb-4">
          {/* Only show Kanban view, no view switcher UI */}
        </div>

        {/* Analysis Schedules Content */}
        {activeSection === 'schedules' && (
          <>
            {otherSchedules.length > 0 ? (
              renderKanbanView()
            ) : (
              <div className="text-center py-12 lg:py-16 px-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#8C74FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#8C74FF]/20">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-[#8C74FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">No reporting schedules yet</h3>
                <p className="text-base text-[#7B7B7B] mb-8 max-w-md mx-auto">
                  Create analysis schedules to get regular insights about your store&apos;s performance
                </p>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-8 py-3 bg-[#8C74FF] hover:bg-[#8C74FF]/90 rounded-lg transition-all duration-200 text-base font-medium text-white shadow-md shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30"
                >
                  Create Schedule
                </button>
              </div>
            )}
          </>
        )}

        {/* Render Alert Agents below Analysis Schedules */}
        <hr className="border-t border-[#2C2D32] my-12" />
        {/* Custom Reports Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-light text-white flex items-center gap-2 mb-0">
              Custom Reports
              {customReports.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[#8C74FF]/20 text-[#8C74FF] rounded-full">
                  {customReports.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => router.push('/app')}
              className="px-4 py-2 bg-[#8C74FF] hover:bg-[#7B63EE] text-white rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Create Custom Report
            </button>
          </div>

          {customReports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {customReports.map((report) => (
                <CustomReportCard
                  key={report.id}
                  report={report}
                  onDelete={handleDeleteCustomReport}
                  isDeleting={isDeletingCustomReport === report.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-16 px-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#8C74FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#8C74FF]/20">
                <svg className="w-8 h-8 lg:w-10 lg:h-10 text-[#8C74FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">No custom reports yet</h3>
              <p className="text-base text-[#7B7B7B] mb-6 max-w-md mx-auto">
                Create a tailored report to get the exact metrics you care about delivered on your schedule
              </p>
              <button
                onClick={() => router.push('/app')}
                className="px-8 py-3 bg-[#8C74FF] hover:bg-[#8C74FF]/90 rounded-lg transition-all duration-200 text-base font-medium text-white shadow-md shadow-[#8C74FF]/20 hover:shadow-lg hover:shadow-[#8C74FF]/30"
              >
                Create Custom Report
              </button>
            </div>
          )}
        </div>
        {/* End Custom Reports Section */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <h2 className="text-xl sm:text-2xl font-light text-white flex items-center gap-2 mb-0">
                Alerts
                {safeAlerts.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF9800]/20 text-[#FF9800] rounded-full">
                    {safeAlerts.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:items-center md:justify-end">
              <input
                type="text"
                placeholder="Search alerts..."
                className="bg-[#23272b] text-white px-4 py-2 rounded-lg border border-[#2C2D32] focus:outline-none focus:ring-2 focus:ring-[#FF9800]/30 w-full md:w-64 text-base md:text-sm"
                value={alertSearch}
                onChange={e => setAlertSearch(e.target.value)}
              />
              <select className="bg-[#23272b] text-white px-4 py-2 rounded-lg border border-[#2C2D32] focus:outline-none w-full md:w-36 min-w-0 text-base md:text-sm">
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select className="bg-[#23272b] text-white px-4 py-2 rounded-lg border border-[#2C2D32] focus:outline-none w-full md:w-40 min-w-0 text-base md:text-sm">
                <option value="">Date created</option>
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {safeAlerts
              .filter(alert => alert.name.toLowerCase().includes(alertSearch.toLowerCase()))
              .map(alert => (
                <div key={alert.id} className="bg-[#181A1B] rounded-2xl p-6 shadow-lg border border-[#FF9800]/10 flex flex-col justify-between min-h-[220px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl hover:border-[#FF9800]/40">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getMetricColor(alert.metric) }} />
                      <h3 className="font-semibold text-white text-lg">{alert.name}</h3>
                    </div>
                    <button
                      onClick={() => {/* toggle logic here */}}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF9800]/50 focus:ring-offset-2 focus:ring-offset-[#141718] ${alert.is_active ? 'bg-green-500' : 'bg-[#2C2D32]'}`}
                    >
                      <span
                        className={`${alert.is_active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                  <p className="text-[#7B7B7B] text-sm mb-2">{alert.instructions}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-[#23272b] text-white px-3 py-1 rounded-full text-xs">{formatMetricType(alert.metric)}</span>
                    <span className="bg-[#23272b] text-white px-3 py-1 rounded-full text-xs">{alert.frequency}</span>
                  </div>
                  <div className="text-xs text-[#7B7B7B] mb-2">Last checked: {alert.last_evaluated ? new Date(alert.last_evaluated).toLocaleString() : 'N/A'}</div>
                  <div className="flex gap-2 mt-auto">
                    <button className="px-4 py-1.5 bg-[#23272b] text-white rounded-lg text-sm hover:bg-[#2C2D32] transition-colors">Edit</button>
                    <button className="px-4 py-1.5 bg-[#23272b] text-white rounded-lg text-sm hover:bg-[#2C2D32] transition-colors">Run</button>
                    <button className="px-4 py-1.5 bg-[#23272b] text-white rounded-lg text-sm hover:bg-[#2C2D32] transition-colors">...</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* CEO Briefing Modal */}
      {ceoSchedule && (
        <CeoBriefingModal
          isOpen={isCeoModalOpen}
          onClose={() => setIsCeoModalOpen(false)}
          schedule={ceoSchedule}
          onSave={handleUpdateCeoSchedule}
        />
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleAdd={handleScheduleAdd}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onAlertAdd={handleAlertAdd}
        usageStatus={safeUsageStatus || undefined}
      />
    </div>
  );
}