import { Pipe, PipeTransform } from '@angular/core';
import type { Translations } from '../../core/i18n/translations';

/**
 * Milliseconds in one day.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Days below which the label counts rather than dates.
 */
const RELATIVE_DAYS = 7;

/**
 * Local midnight of the date, as a timestamp.
 */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * "Today", "Yesterday", "3 days ago", then the full date. The row's date slot needs no
 * "Published" prefix: it repeats on every line and says nothing the position doesn't.
 */
@Pipe({ name: 'publishedLabel' })
export class PublishedLabelPipe implements PipeTransform {
  /**
   * ISO date to its label; the wording is an argument so the language change reaches the pipe.
   */
  transform(value: string | null, text: Translations, now: Date = new Date()): string {
    if (!value) return '';
    const published = new Date(value);
    const days = Math.round((startOfDay(now) - startOfDay(published)) / DAY_MS);

    if (days <= 0) return text.published.today;
    if (days === 1) return text.published.yesterday;
    if (days < RELATIVE_DAYS) return text.published.daysAgo(days);
    return published.toLocaleDateString(text.tag);
  }
}
