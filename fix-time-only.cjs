const fs = require('fs');
let content = fs.readFileSync('src/utils/timezone.ts', 'utf8');

const timeFunc = `/**
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

`;

content = content.replace("export function formatCurrentTimeInZone", timeFunc + "export function formatCurrentTimeInZone");
fs.writeFileSync('src/utils/timezone.ts', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/formatDateTimeInZone/g, 'formatTimeInZone');
fs.writeFileSync('src/App.tsx', appContent);
