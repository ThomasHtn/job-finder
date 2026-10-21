import { Pipe, PipeTransform } from '@angular/core';

import { translate } from '@jsverse/transloco';

import { calendarDaysBetween } from '@core/date/date.utils';
import { AppLocale } from '@core/i18n/i18n.model';

import { RELATIVE_DAYS } from './job-row.constants';

/**
 * "Today", "Yesterday", "3 days ago", then the full date. The row's date slot needs no
 * "Published" prefix: it repeats on every line and says nothing the position doesn't.
 */
@Pipe({ name: 'publishedLabel' })
export class PublishedLabelPipe implements PipeTransform {
  /**
   * ISO date to its label. The language and the clock are arguments: a pure pipe only recomputes
   * when they change, and both a switch and midnight must reach it.
   */
  public transform(value: string | null, _locale: AppLocale, now: Date): string {
    if (!value) {
      return '';
    }
    const published = new Date(value);
    const days = calendarDaysBetween(published, now);
    if (days <= 0) {
      return translate('published.today');
    }
    if (days === 1) {
      return translate('published.yesterday');
    }
    if (days < RELATIVE_DAYS) {
      return translate('published.daysAgo', { days });
    }
    return published.toLocaleDateString(translate('date.tag'));
  }
}
