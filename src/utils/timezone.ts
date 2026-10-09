/**
 * Timezone utilities for Lisburn
 * Automatically detects the user's device timezone and provides timezone-aware date formatting.
 */

export interface TimeZoneOption {
  value: string;
  label: string;
  region: string;
}

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getEffectiveTimeZone(configuredTimeZone?: string): string {
  if (configuredTimeZone && configuredTimeZone !== 'auto') {
    return configuredTimeZone;
  }
  return getDeviceTimeZone();
}

/**
 * Returns a YYYY-MM-DDThh:mm string representing the current time in the given timezone.
 * Useful for initializing <input type="datetime-local">.
 */
export function getCurrentLocalDateTimeString(tz?: string): string {
  const effectiveTz = getEffectiveTimeZone(tz);
  const now = new Date();
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
      timeZone: effectiveTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Some browsers format this as YYYY-MM-DD, HH:MM
    // We want to replace the ", " or " " with "T" to get YYYY-MM-DDThh:mm
    const parts = formatter.formatToParts(now);
    
    const year = parts.find(p => p.type === 'year')?.value || now.getFullYear().toString();
    const month = parts.find(p => p.type === 'month')?.value || (now.getMonth() + 1).toString().padStart(2, '0');
    const day = parts.find(p => p.type === 'day')?.value || now.getDate().toString().padStart(2, '0');
    const hour = parts.find(p => p.type === 'hour')?.value || now.getHours().toString().padStart(2, '0');
    const minute = parts.find(p => p.type === 'minute')?.value || now.getMinutes().toString().padStart(2, '0');

    // Handle hour=24 issue if returned by some environments
    const fixedHour = hour === '24' ? '00' : hour;
    
    return `${year}-${month}-${day}T${fixedHour}:${minute}`;
  } catch {
    // Fallback to local device time
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
}

/**
 * Returns formatted offset string like "UTC-07:00" or "UTC+01:00"
 */
export function getTimeZoneOffset(tz: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      // Returns e.g. "GMT-07:00"
      return tzPart.value.replace('GMT', 'UTC');
    }
  } catch {
    // Fallback using Date offset
  }

  try {
    const d = new Date();
    const utcDate = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(d.toLocaleString('en-US', { timeZone: tz }));
    const diffMin = Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60));
    const sign = diffMin >= 0 ? '+' : '-';
    const absMin = Math.abs(diffMin);
    const hours = Math.floor(absMin / 60).toString().padStart(2, '0');
    const mins = (absMin % 60).toString().padStart(2, '0');
    return `UTC${sign}${hours}:${mins}`;
  } catch {
    return 'UTC';
  }
}

/**
 * Returns human-friendly timezone name e.g. "Pacific Daylight Time" or abbreviation "PDT"
 */
export function getTimeZoneName(tz: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || tz;
  } catch {
    return tz;
  }
}

/**
 * Formats current live time in given timezone (e.g. "5:04 PM")
 */
/**
 * Formats a date string to just the time (e.g. "4:20 PM") in the given timezone
 */
export function formatTimeInZone(isoString: string | null, tz?: string): string {
  if (!isoString) return '';
  const effectiveTz = getEffectiveTimeZone(tz);
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return '';
  }
}

export function formatCurrentTimeInZone(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}

/**
 * Formats a date string in the given timezone (Full Date & Time)
 */
export function formatDateTimeInZone(isoString: string | null, tz?: string): string {
  if (!isoString) return 'No date recorded';
  const effectiveTz = getEffectiveTimeZone(tz);
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTz,
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

/**
 * Formats a date string in the given timezone (e.g. "Aug 14, 2026")
 */
export function formatShortDateInZone(isoString: string | null, tz?: string): string {
  if (!isoString) return 'No date recorded';
  const effectiveTz = getEffectiveTimeZone(tz);
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTz,
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formats a date string with full month (e.g. "August 14, 2026")
 */
export function formatLongDateInZone(isoString: string | null, tz?: string): string {
  if (!isoString) return '-';
  const effectiveTz = getEffectiveTimeZone(tz);
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTz,
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return '-';
  }
}

export const POPULAR_TIMEZONES: TimeZoneOption[] = [
  { value: 'auto', label: 'Automatic (Device Time Zone)', region: 'Auto' },
  
  // North America
  { value: 'America/New_York', label: 'Eastern Time (New York, Toronto)', region: 'North America' },
  { value: 'America/Chicago', label: 'Central Time (Chicago, Dallas)', region: 'North America' },
  { value: 'America/Denver', label: 'Mountain Time (Denver, Calgary)', region: 'North America' },
  { value: 'America/Phoenix', label: 'Arizona (Phoenix - No DST)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles, Vancouver)', region: 'North America' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)', region: 'North America' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)', region: 'North America' },
  
  // Europe
  { value: 'Europe/London', label: 'London, Dublin, Edinburgh (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome, Madrid (CET)', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens, Helsinki, Bucharest (EET)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', region: 'Europe' },
  
  // Asia & Pacific
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi (GST)', region: 'Asia / Pacific' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (New Delhi, Mumbai)', region: 'Asia / Pacific' },
  { value: 'Asia/Bangkok', label: 'Bangkok, Hanoi, Jakarta (ICT)', region: 'Asia / Pacific' },
  { value: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur (SGT)', region: 'Asia / Pacific' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong, Beijing (HKT/CST)', region: 'Asia / Pacific' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka, Seoul (JST/KST)', region: 'Asia / Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne, Canberra (AEST)', region: 'Asia / Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland, Wellington (NZST)', region: 'Asia / Pacific' },
  
  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo, Rio de Janeiro (BRT)', region: 'South America' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'South America' },

  // UTC
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', region: 'Global' }
];
