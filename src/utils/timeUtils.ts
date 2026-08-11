import { StatusFilter } from '../types';

export interface TimeElapsedBreakdown {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
}

export function getTimeBreakdown(lastCompletedAtISO: string | null): TimeElapsedBreakdown {
  if (!lastCompletedAtISO) {
    return { days: 0, hours: 0, minutes: 0, totalMinutes: 0, totalHours: 0, totalDays: 0 };
  }
  const now = new Date().getTime();
  const completed = new Date(lastCompletedAtISO).getTime();
  const diffMs = Math.max(0, now - completed);

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const days = totalDays;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  return {
    days,
    hours,
    minutes,
    totalMinutes,
    totalHours,
    totalDays
  };
}

export function formatDaysCount(lastCompletedAtISO: string | null): string {
  if (!lastCompletedAtISO) return '-';
  const breakdown = getTimeBreakdown(lastCompletedAtISO);
  return `${breakdown.days}`;
}

export function formatTimeElapsed(lastCompletedAtISO: string | null, showExactHours: boolean = false): string {
  if (!lastCompletedAtISO) return 'No date recorded';
  const breakdown = getTimeBreakdown(lastCompletedAtISO);

  if (breakdown.totalMinutes < 1) {
    return 'Just now';
  }

  if (breakdown.totalHours < 1) {
    return `${breakdown.minutes}m ago`;
  }

  if (breakdown.totalHours < 24) {
    return `${breakdown.hours}h ago`;
  }

  if (showExactHours && breakdown.hours > 0) {
    return `${breakdown.days}d ${breakdown.hours}h ago`;
  }

  if (breakdown.days === 1) {
    return '1 day ago';
  }

  return `${breakdown.days} days ago`;
}

export function getTaskStatusType(lastCompletedAtISO: string | null, intervalHours: number | null): 'overdue' | 'due-soon' | 'fresh' | 'none' {
  if (!lastCompletedAtISO) return 'none';
  if (!intervalHours || intervalHours <= 0) {
    return 'none';
  }

  const breakdown = getTimeBreakdown(lastCompletedAtISO);
  const hoursElapsed = breakdown.totalHours;

  if (hoursElapsed >= intervalHours) {
    return 'overdue';
  }

  // Due soon if past 80% of interval
  if (hoursElapsed >= intervalHours * 0.8) {
    return 'due-soon';
  }

  return 'fresh';
}

export function getProgressPercentage(lastCompletedAtISO: string | null, intervalHours: number | null): number {
  if (!lastCompletedAtISO || !intervalHours || intervalHours <= 0) return 0;
  
  const breakdown = getTimeBreakdown(lastCompletedAtISO);
  const hoursElapsed = breakdown.totalHours;
  const pct = (hoursElapsed / intervalHours) * 100;
  return Math.min(100, Math.max(0, pct));
}

export function formatIntervalText(intervalHours: number | null): string {
  if (!intervalHours || intervalHours <= 0) return 'No reminder';

  if (intervalHours === 1) return 'Every 1 hour';
  if (intervalHours < 24) return `Every ${intervalHours} hours`;
  
  const days = Math.round(intervalHours / 24);
  if (days === 1) return 'Every day';
  if (days === 7) return 'Every 1 week';
  if (days === 14) return 'Every 2 weeks';
  if (days === 30) return 'Every 1 month';
  if (days === 60) return 'Every 2 months';
  if (days === 90) return 'Every 3 months';
  if (days === 180) return 'Every 6 months';
  if (days === 365) return 'Every 1 year';

  return `Every ${days} days`;
}

export function formatDateString(isoString: string | null): string {
  if (!isoString) return 'No date recorded';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatShortDate(isoString: string | null): string {
  if (!isoString) return 'No date recorded';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatShortTimeSince(lastCompletedAtISO: string | null): string {
  if (!lastCompletedAtISO) return '-';
  const breakdown = getTimeBreakdown(lastCompletedAtISO);
  const totalDays = breakdown.totalDays;
  if (totalDays < 1) {
    if (breakdown.totalHours < 1) return `${breakdown.minutes}m`;
    return `${breakdown.hours}h`;
  }
  if (totalDays >= 365) {
    const yrs = Math.floor(totalDays / 365);
    return `${yrs}yr`;
  }
  if (totalDays >= 30) {
    const mos = Math.floor(totalDays / 30);
    return `${mos}mo`;
  }
  return `${totalDays}d`;
}
