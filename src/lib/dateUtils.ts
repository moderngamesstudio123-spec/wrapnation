/**
 * Indian Standard Time (IST) Date Utilities for Wrap Nation
 * Timezone: Asia/Kolkata (UTC + 5:30)
 * 
 * Ensures daily orders and financial reports reset and calculate
 * strictly at 12:00 AM midnight Indian Standard Time (Hyderabad).
 */

/**
 * Returns a Date representing 00:00:00.000 IST for the given date.
 */
export function getIstStartOfDay(targetDate?: Date | string): Date {
  const d = targetDate ? new Date(targetDate) : new Date();
  // Format as YYYY-MM-DD in Asia/Kolkata timezone
  const istDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${istDateStr}T00:00:00+05:30`);
}

/**
 * Returns a Date representing 23:59:59.999 IST for the given date.
 */
export function getIstEndOfDay(targetDate?: Date | string): Date {
  const d = targetDate ? new Date(targetDate) : new Date();
  const istDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${istDateStr}T23:59:59.999+05:30`);
}

/**
 * Returns current date string in IST formatted as YYYY-MM-DD.
 */
export function getIstTodayString(targetDate?: Date | string): string {
  const d = targetDate ? new Date(targetDate) : new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Formats a Date object into a readable IST time string: "01:45 PM"
 */
export function formatIstTime(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a Date object into a readable IST date string: "Tuesday, 27 October 2026"
 */
export function formatIstDateFull(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
