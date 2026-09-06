import { Pipe, PipeTransform } from '@angular/core';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * "Aujourd'hui", "Hier", "Il y a 3 jours", then the full date. The row's date slot needs no
 * "Publié" prefix: it repeats on every line and says nothing the position doesn't.
 */
@Pipe({ name: 'publishedLabel' })
export class PublishedLabelPipe implements PipeTransform {
  transform(value: string | null, now: Date = new Date()): string {
    if (!value) return '';
    const published = new Date(value);
    const days = Math.round((startOfDay(now) - startOfDay(published)) / DAY_MS);

    if (days <= 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return published.toLocaleDateString('fr-FR');
  }
}
