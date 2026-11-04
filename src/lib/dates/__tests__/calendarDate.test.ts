import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calendarDateToUtc,
  formatCalendarDate,
  getExpiryStatus,
  getWeekdayName,
  isCalendarDate,
  localCalendarDate,
  resolveUserToday,
  utcToCalendarDate,
} from '../calendarDate';

describe('isCalendarDate', () => {
  it.each(['2026-11-08', '2026-12-31', '2028-02-29'])('accepts the real date %s', (date) => {
    expect(isCalendarDate(date)).toBe(true);
  });

  it.each(['2026-02-30', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10'])(
    'rejects %s, which is not on the calendar',
    (date) => {
      expect(isCalendarDate(date)).toBe(false);
    },
  );

  it.each([
    '',
    'next Wednesday',
    '1794096000000',
    '2026-11-8',
    '2026-11-08T00:00:00.000Z',
    1794096000000,
    null,
    undefined,
  ])('rejects %j, which is not YYYY-MM-DD', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});

describe('conversion to and from the stored form', () => {
  it('maps a calendar date to UTC midnight and back', () => {
    const stored = calendarDateToUtc('2026-11-08');
    expect(stored.toISOString()).toBe('2026-11-08T00:00:00.000Z');
    expect(utcToCalendarDate(stored)).toBe('2026-11-08');
  });
});

describe.each(['Asia/Taipei', 'America/New_York', 'Pacific/Kiritimati', 'UTC'])(
  'in the %s time zone',
  (timeZone) => {
    beforeEach(() => vi.stubEnv('TZ', timeZone));
    afterEach(() => vi.unstubAllEnvs());

    it('really runs in that time zone', () => {
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(timeZone);
    });

    it('shows the stored day without shifting it', () => {
      expect(formatCalendarDate('2026-11-08')).toBe(new Date(2026, 10, 8).toLocaleDateString());
    });

    it('keeps the same day through the stored form', () => {
      expect(utcToCalendarDate(calendarDateToUtc('2026-11-08'))).toBe('2026-11-08');
    });

    it('names the weekday of the calendar date', () => {
      expect(getWeekdayName('2026-11-04')).toBe('Wednesday');
    });
  },
);

describe('localCalendarDate', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reads the day from the device clock, not from UTC', () => {
    vi.stubEnv('TZ', 'Asia/Taipei');
    expect(localCalendarDate(new Date('2026-11-08T20:00:00.000Z'))).toBe('2026-11-09');

    vi.stubEnv('TZ', 'America/New_York');
    expect(localCalendarDate(new Date('2026-11-09T02:00:00.000Z'))).toBe('2026-11-08');
  });
});

describe('getExpiryStatus', () => {
  it.each([
    ['2026-11-07', 'EXPIRED'],
    ['2026-01-01', 'EXPIRED'],
    ['2026-11-08', 'TODAY'],
    ['2026-11-09', 'SOON'],
    ['2026-11-11', 'SOON'],
    ['2026-11-12', 'OK'],
    ['2027-01-01', 'OK'],
  ])('with today 2026-11-08, an expiry of %s is %s', (expiryDate, status) => {
    expect(getExpiryStatus(expiryDate, '2026-11-08')).toBe(status);
  });

  it('counts across a month boundary', () => {
    expect(getExpiryStatus('2026-11-01', '2026-10-31')).toBe('SOON');
  });

  it('counts whole days across a daylight saving change', () => {
    vi.stubEnv('TZ', 'America/New_York');
    expect(getExpiryStatus('2026-03-11', '2026-03-08')).toBe('SOON');
    expect(getExpiryStatus('2026-03-12', '2026-03-08')).toBe('OK');
    vi.unstubAllEnvs();
  });
});

describe('resolveUserToday', () => {
  // 20:00 UTC on Nov 3 is already 04:00 on Nov 4 in Taiwan.
  const now = new Date('2026-11-03T20:00:00.000Z');

  it('trusts the day the device reports, which can be one day either side of UTC', () => {
    expect(resolveUserToday('2026-11-04', now)).toBe('2026-11-04');
    expect(resolveUserToday('2026-11-03', now)).toBe('2026-11-03');
    expect(resolveUserToday('2026-11-02', now)).toBe('2026-11-02');
  });

  it('falls back to the server day when the device clock is clearly wrong', () => {
    expect(resolveUserToday('2026-11-05', now)).toBe('2026-11-03');
    expect(resolveUserToday('2020-01-01', now)).toBe('2026-11-03');
  });

  it('falls back to the server day when the client sends nothing', () => {
    expect(resolveUserToday(null, now)).toBe('2026-11-03');
    expect(resolveUserToday(undefined, now)).toBe('2026-11-03');
  });
});
