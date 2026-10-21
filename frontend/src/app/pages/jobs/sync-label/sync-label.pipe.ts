import { Pipe, PipeTransform } from '@angular/core';

import { translate } from '@jsverse/transloco';

import { DAY_MS, HOUR_MS, MINUTE_MS } from '@core/date/date.constants';
import { calendarDaysBetween } from '@core/date/date.utils';
import { AppLocale } from '@core/i18n/i18n.model';

/**
 * How long ago the sources were last read. Short enough for the header of a phone, and
 * relative because the exact minute of a background job is not what the reader is after.
 */
@Pipe({ name: 'syncLabel' })
export class SyncLabelPipe implements PipeTransform {
  /**
   * ISO date to its label. The language and the clock are arguments: a pure pipe only recomputes
   * when they change, and both a switch and the passing minutes must reach it.
   */
  public transform(value: string | null, _locale: AppLocale, now: Date): string {
    if (!value) {
      return translate('sync.never');
    }
    const elapsed = now.getTime() - new Date(value).getTime();
    if (elapsed < MINUTE_MS) {
      return translate('sync.justNow');
    }
    if (elapsed < HOUR_MS) {
      return translate('sync.minutesAgo', { minutes: Math.floor(elapsed / MINUTE_MS) });
    }
    if (elapsed < DAY_MS) {
      return translate('sync.hoursAgo', { hours: Math.floor(elapsed / HOUR_MS) });
    }
    const days = calendarDaysBetween(new Date(value), now);
    if (days === 1) {
      return translate('sync.yesterday');
    }
    return translate('sync.daysAgo', { days });
  }
}
