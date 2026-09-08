import { Pipe, PipeTransform } from '@angular/core';

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
   * ISO date to its label; `now` is a parameter so tests are deterministic.
   */
  transform(value: string | null, now: Date = new Date()): string {
    if (!value) return 'Jamais synchronisé';

    const elapsed = now.getTime() - new Date(value).getTime();
    if (elapsed < MINUTE_MS) return "À l'instant";
    if (elapsed < HOUR_MS) return `Il y a ${Math.floor(elapsed / MINUTE_MS)} min`;
    if (elapsed < DAY_MS) return `Il y a ${Math.floor(elapsed / HOUR_MS)} h`;
    if (elapsed < 2 * DAY_MS) return 'Hier';
    return `Le ${new Date(value).toLocaleDateString('fr-FR')}`;
  }
}
