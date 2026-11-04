// ---------------------------------------------------------------------------
// A calendar date is a day on the calendar, not a moment in time: an item that
// expires on "2026-11-08" expires on that day wherever the user is. So it stays
// a YYYY-MM-DD string everywhere, and no time zone ever applies to it.
//
// The one exception is Prisma, which represents a date as a Date at UTC midnight.
// calendarDateToUtc and utcToCalendarDate are the bridge between the two forms.
// ---------------------------------------------------------------------------

const CALENDAR_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPIRES_SOON_DAYS = 3;
// A device's local date is never more than one day away from the UTC date.
const MAX_DAYS_FROM_UTC = 1;

export type ExpiryStatus = 'EXPIRED' | 'TODAY' | 'SOON' | 'OK';

export function calendarDateToUtc(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

export function utcToCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !CALENDAR_DATE_FORMAT.test(value)) return false;
  const date = calendarDateToUtc(value);
  // A day like 2026-02-30 either fails to parse or rolls over into March.
  return !Number.isNaN(date.getTime()) && utcToCalendarDate(date) === value;
}

/** Today on the device's own calendar. Meant for the browser, not the server. */
export function localCalendarDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatCalendarDate(calendarDate: string): string {
  return calendarDateToUtc(calendarDate).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

export function getWeekdayName(calendarDate: string): string {
  return calendarDateToUtc(calendarDate).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
}

function daysBetween(from: string, to: string): number {
  const difference = calendarDateToUtc(to).getTime() - calendarDateToUtc(from).getTime();
  return Math.round(difference / MS_PER_DAY);
}

export function getExpiryStatus(
  expiryDate: string,
  today: string = localCalendarDate(),
): ExpiryStatus {
  const daysLeft = daysBetween(today, expiryDate);
  if (daysLeft < 0) return 'EXPIRED';
  if (daysLeft === 0) return 'TODAY';
  if (daysLeft <= EXPIRES_SOON_DAYS) return 'SOON';
  return 'OK';
}

/**
 * The day the user is living in, for server code that needs "today". The server
 * clock runs on UTC, which is a different date for part of every day, so the
 * device's date wins unless it is too far off to be real.
 */
export function resolveUserToday(
  clientToday: string | null | undefined,
  now: Date = new Date(),
): string {
  const serverToday = utcToCalendarDate(now);
  if (clientToday && Math.abs(daysBetween(serverToday, clientToday)) <= MAX_DAYS_FROM_UTC) {
    return clientToday;
  }
  return serverToday;
}
