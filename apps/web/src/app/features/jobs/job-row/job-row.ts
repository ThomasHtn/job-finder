import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { JobSummary } from '@job-finder/shared';
import { LastVisitService } from '../../../core/last-visit.service';
import { Icon } from '../../../shared/icon/icon';
import { PublishedLabelPipe } from '../published-label.pipe';

/**
 * Contract wording that every offer shares, hence not worth a slot in the row.
 */
const DEFAULT_CONTRACT = 'CDI';

/**
 * One line of the feed: title, who and where, an excerpt, then the provenance strip.
 */
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
  /**
   * Previous visit timestamp, for the "new" badge.
   */
  private readonly lastVisit = inject(LastVisitService);

  /**
   * The offer to render.
   */
  readonly job = input.required<JobSummary>();

  /**
   * Emits the offer id when the star is pressed.
   */
  readonly favoriteToggled = output<string>();

  /**
   * Emits the offer id when the hide button is pressed.
   */
  readonly hidden = output<string>();

  /**
   * True when the offer first appeared after the previous time the feed was consulted.
   */
  protected readonly isNew = computed(() => {
    const previous = this.lastVisit.previousVisitAt;
    return previous !== null && this.job().firstSeenAt > previous;
  });

  /**
   * Every offer aggregated here is permanent: only a different wording earns a slot.
   */
  protected readonly contract = computed(() => {
    const label = this.job().contractLabel;
    return label && label.toUpperCase() !== DEFAULT_CONTRACT ? label : null;
  });

  /**
   * "76 - LE HAVRE" like France Travail, or the closest the source allows.
   */
  protected readonly place = computed(() => {
    const { isRemote, city, postalCode } = this.job();
    if (isRemote) return 'Full remote';
    if (!city) return 'Lieu non précisé';
    return postalCode ? `${postalCode.slice(0, 2)} - ${city}` : city;
  });

  /**
   * Star pressed. The whole row is a link: the star must not open the detail.
   */
  protected toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggled.emit(this.job().id);
  }

  /**
   * Hide pressed; same event handling as the star.
   */
  protected hide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.hidden.emit(this.job().id);
  }
}
