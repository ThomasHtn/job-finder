import { Pipe, PipeTransform } from '@angular/core';
import type { Translations } from '../../core/i18n/translations';

/**
 * Milliseconds in a minute, an hour and a day.
 */
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long ago the sources were last read. Short enough for the header of a phone, and
 * relative because the exact minute of a background job is not what the reader is after.
 */
@Pipe({ name: 'syncLabel' })
export class SyncLabelPipe implements PipeTransform {
  /**
   * ISO date to its label. The wording is an argument rather than an injection: a pure pipe
   * only recomputes when its arguments change, and the language is one of them.
   */
  transform(value: string | null, text: Translations, now: Date = new Date()): string {
    if (!value) return text.sync.never;

    const elapsed = now.getTime() - new Date(value).getTime();
    if (elapsed < MINUTE_MS) return text.sync.justNow;
    if (elapsed < HOUR_MS) return text.sync.minutesAgo(Math.floor(elapsed / MINUTE_MS));
    if (elapsed < DAY_MS) return text.sync.hoursAgo(Math.floor(elapsed / HOUR_MS));
    if (elapsed < 2 * DAY_MS) return text.sync.yesterday;
    return text.sync.onDate(new Date(value).toLocaleDateString(text.tag));
  }
}
