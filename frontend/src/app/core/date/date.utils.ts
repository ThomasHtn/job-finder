import { DAY_MS } from './date.constants';

/**
 * Local midnight of the date, as a timestamp.
 */
export function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Midnights crossed from `earlier` to `later`: 0 the same day, 1 the day after, whatever the hours.
 */
export function calendarDaysBetween(earlier: Date, later: Date): number {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / DAY_MS);
}
