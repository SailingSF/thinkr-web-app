'use client';

import { CustomReport } from '@/hooks/useLocalStorage';

interface CustomReportCardProps {
  report: CustomReport;
}

const formatDateTime = (value: string | null) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'N/A';
  }
};

export default function CustomReportCard({ report }: CustomReportCardProps) {
  const metricsArray: string[] = Array.isArray(report.metrics)
    ? report.metrics as string[]
    : Object.keys(report.metrics || {});

  return (
    <div className="bg-[#141718] rounded-xl border border-[#2C2D32] p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{report.name}</h3>
          {report.description && (
            <p className="text-sm text-[#7B7B7B] mt-1 line-clamp-3">{report.description}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
            report.is_active
              ? 'bg-[#22C55E]/10 text-[#22C55E] ring-1 ring-[#22C55E]/20'
              : 'bg-[#7B7B7B]/10 text-[#7B7B7B] ring-1 ring-[#7B7B7B]/20'
          }`}
        >
          {report.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {metricsArray.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {metricsArray.map((metric) => (
            <span
              key={metric}
              className="bg-[#23272b] text-white px-3 py-1 rounded-full text-xs"
            >
              {metric}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9A9A9A]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7B7B7B]/30" />
          <span>Last delivered:</span>
          <span className="text-white/80">{formatDateTime(report.last_run)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8C74FF]/50" />
          <span>Next delivery:</span>
          <span className="text-white/80">{formatDateTime(report.next_run)}</span>
        </div>
      </div>
    </div>
  );
}


