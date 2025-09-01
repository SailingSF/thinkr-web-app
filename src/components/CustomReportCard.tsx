'use client';

import { CustomReport } from '@/hooks/useLocalStorage';

interface CustomReportCardProps {
  report: CustomReport;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onEdit?: (report: CustomReport) => void;
}

const formatDateTime = (value: string | null) => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    // Compact, card-friendly format like: Sep 1, 9:00 AM
    const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${date}, ${time}`;
  } catch {
    return 'N/A';
  }
};

export default function CustomReportCard({ report, onDelete, isDeleting, onEdit }: CustomReportCardProps) {
  const metricsArray: string[] = Array.isArray(report.metrics)
    ? report.metrics as string[]
    : Object.keys(report.metrics || {});

  return (
    <div className="bg-[#141718] rounded-xl border border-[#2C2D32] p-6 relative group hover:border-[#8C74FF]/40 transition-colors">
      {onDelete && (
        <button
          aria-label="Delete custom report"
          onClick={() => onDelete(report.id)}
          disabled={!!isDeleting}
          className="absolute -top-2 -right-2 text-red-400 hover:text-red-300 disabled:text-red-400/50 disabled:cursor-not-allowed w-6 h-6 rounded-full bg-red-400/20 flex items-center justify-center transition-colors shadow-sm hover:shadow-md ring-1 ring-red-400/30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{report.name}</h3>
          {report.description && (
            <p className="text-sm text-[#7B7B7B] mt-1 line-clamp-3">{report.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(report)}
              className="px-2 py-1 text-xs text-white/90 bg-[#23272b] hover:bg-[#2C2D32] rounded-md transition-colors border border-[#2C2D32]"
            >
              Edit
            </button>
          )}
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

      {/* Deletion is handled only by the top-right X button */}
    </div>
  );
}


