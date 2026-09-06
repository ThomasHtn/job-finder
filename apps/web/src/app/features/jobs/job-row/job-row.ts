import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { JobSummary } from '@job-finder/shared';
import { LastVisitService } from '../../../core/last-visit.service';
import { Icon } from '../../../shared/icon/icon';
import { PublishedLabelPipe } from '../published-label.pipe';

/** One line of the feed: title, who and where, an excerpt, then the provenance strip. */
@Component({
  selector: 'app-job-row',
  imports: [RouterLink, Icon, PublishedLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-row.html',
  styleUrl: './job-row.scss',
  host: {
    class: 'job-row',
    '[class.job-row--viewed]': 'job().isViewed',
    '[class.job-row--new]': 'isNew()',
    '[class.job-row--starred]': 'job().isFavorite',
  },
})
export class JobRow {
  private readonly lastVisit = inject(LastVisitService);

  readonly job = input.required<JobSummary>();
  readonly favoriteToggled = output<string>();
  readonly hidden = output<string>();

  /** True when the offer first appeared after the previous time the feed was consulted. */
  protected readonly isNew = computed(() => {
    const previous = this.lastVisit.previousVisitAt;
    return previous !== null && this.job().firstSeenAt > previous;
  });

  /** Every offer aggregated here is permanent: only a different wording earns a slot. */
  protected readonly contract = computed(() => {
    const label = this.job().contractLabel;
    return label && label.toUpperCase() !== 'CDI' ? label : null;
  });

  /** "76 - LE HAVRE" like France Travail, or the closest the source allows. */
  protected readonly place = computed(() => {
    const { isRemote, city, postalCode } = this.job();
    if (isRemote) return 'Full remote';
    if (!city) return 'Lieu non précisé';
    return postalCode ? `${postalCode.slice(0, 2)} - ${city}` : city;
  });

  protected toggleFavorite(event: Event): void {
    // The whole row is a link: the star must not open the detail.
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggled.emit(this.job().id);
  }

  protected hide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.hidden.emit(this.job().id);
  }
}
