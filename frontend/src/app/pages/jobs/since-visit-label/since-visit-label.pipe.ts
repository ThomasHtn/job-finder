import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

import { translate } from '@jsverse/transloco';

import { FORMAT_LOCALE } from '@core/date/date.constants';
import { calendarDaysBetween } from '@core/date/date.utils';
import { AppLocale } from '@core/i18n/i18n.model';

/**
 * When the previous visit was, under the count of new offers: "since your visit yesterday at
 * 18:40". The hour matters the same day and the day after; beyond, the date alone.
 */
@Pipe({ name: 'sinceVisitLabel' })
export class SinceVisitLabelPipe implements PipeTransform {
  /**
   * ISO date to its label, empty on the very first visit. The language and the clock are
   * arguments: a pure pipe only recomputes when they change, and both a switch and midnight must
   * reach it.
   */
  public transform(value: string | null, _locale: AppLocale, now: Date): string {
    if (!value) {
      return '';
    }
    const visit = new Date(value);
    const time = formatDate(visit, translate('date.time'), FORMAT_LOCALE);
    const days = calendarDaysBetween(visit, now);
    if (days <= 0) {
      return translate('feed.sinceVisitAt', { time });
    }
    if (days === 1) {
      return translate('feed.sinceVisitYesterday', { time });
    }
    const date = formatDate(visit, translate('date.shortDay'), FORMAT_LOCALE);
    return translate('feed.sinceVisitOn', { date });
  }
}
