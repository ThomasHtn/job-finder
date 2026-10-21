import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { translate, TranslocoPipe } from '@jsverse/transloco';

import type { JobSummary } from '@job-finder/contract';

import { Clock } from '@core/date/clock';
import { Language } from '@core/i18n/language';
import { isNewSince, rowPlaceLabel } from '@core/jobs/job.utils';
import { JOB_DETAIL_PATH } from '@core/jobs/jobs.constants';
import { LastVisit } from '@core/jobs/last-visit';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';

import { ROW_STACK_LIMIT } from './job-row.constants';
import { unusualContract } from './job-row.utils';
import { PublishedLabelPipe } from './published-label.pipe';

/**
 * One line of the feed: title, who and where, the stack and provenance, the salary beside them.
 */
@Component({
  selector: 'app-job-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, IconButton, PublishedLabelPipe, TranslocoPipe],
  templateUrl: './job-row.html',
  styleUrl: './job-row.scss',
  host: {
    class: 'job-row',
    '[class.job-row--viewed]': 'job().isViewed',
    '[class.job-row--new]': 'isNew()',
    '[class.job-row--starred]': 'job().isFavorite',
    '[class.job-row--selected]': 'selected()',
  },
})
export class JobRow {
  /**
   * Previous visit timestamp, for the "new" badge.
   */
  private readonly lastVisit = inject(LastVisit);

  /**
   * Language in use, which the computed labels follow.
   */
  protected readonly language = inject(Language);

  /**
   * The current minute, so "Today" turns into "Yesterday" past midnight.
   */
  protected readonly now = inject(Clock).now;

  /**
   * The offer to render.
   */
  public readonly job = input.required<JobSummary>();

  /**
   * True while this offer is the one open in the panel.
   */
  public readonly selected = input(false);

  /**
   * Emits the offer id when the star is pressed.
   */
  public readonly favoriteToggled = output<string>();

  /**
   * Emits the offer id when the hide button is pressed.
   */
  public readonly hidden = output<string>();

  /**
   * True when the offer first appeared after the previous time the feed was consulted.
   */
  protected readonly isNew = computed(() => isNewSince(this.job(), this.lastVisit.previousVisitAt));

  /**
   * Route of the offer, opened in the panel beside the feed.
   */
  protected readonly detailLink = computed(() => ['/', JOB_DETAIL_PATH, this.job().id]);

  /**
   * Contract wording, only when it says something other than the usual permanent contract.
   */
  protected readonly contract = computed(() => unusualContract(this.job().contractLabel));

  /**
   * The first stack keywords the offer names, `null` when it names none.
   */
  protected readonly stack = computed(
    () => this.job().stack.slice(0, ROW_STACK_LIMIT).join(', ') || null,
  );

  /**
   * Salary wording from the source, or the short "not stated".
   */
  protected readonly salary = computed(() => {
    this.language.active();
    return this.job().salary ?? translate('row.unknownSalary');
  });

  /**
   * "76 - LE HAVRE" like France Travail, or the closest the source allows.
   */
  protected readonly place = computed(() => {
    this.language.active();
    return rowPlaceLabel(this.job());
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
