import { calendarDaysBetween, startOfDay } from './date.utils';

describe('date utils', () => {
  it('drops the time of day', () => {
    expect(startOfDay(new Date('2026-09-04T15:30:00'))).toBe(
      new Date('2026-09-04T00:00:00').getTime(),
    );
  });

  it('counts midnights rather than hours', () => {
    expect(
      calendarDaysBetween(new Date('2026-09-04T08:00:00'), new Date('2026-09-04T23:00:00')),
    ).toBe(0);
    expect(
      calendarDaysBetween(new Date('2026-09-04T23:30:00'), new Date('2026-09-05T00:10:00')),
    ).toBe(1);
    expect(
      calendarDaysBetween(new Date('2026-09-01T12:00:00'), new Date('2026-09-04T12:00:00')),
    ).toBe(3);
  });
});
