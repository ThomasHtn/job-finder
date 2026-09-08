import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { JobDetail as JobDetailDto } from '@job-finder/shared';
import { I18n } from '../../../core/i18n/i18n.service';
import { Viewport } from '../../../core/viewport';
import { Icon } from '../../../shared/icon/icon';
import { JobPatchBus } from '../job-patch-bus';
import { JobsApi } from '../jobs-api';
import { detailPlaceLabel } from '../place-label';
import { Prose } from '../prose/prose';
import { hostLabel } from './host-label';
import { DISMISS_DISTANCE_PX } from './job-detail.constants';

/**
 * One offer, read next to the feed on a wide screen and as a sheet over it on a phone.
 */
@Component({
  selector: 'app-job-detail',
  imports: [DatePipe, Icon, Prose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss',
  host: {
    '[style.transform]': "dragOffset() ? 'translateY(' + dragOffset() + 'px)' : null",
    '[class.job-detail--dragging]': 'dragging()',
    '(document:keydown.escape)': 'close()',
  },
})
export class JobDetail {
  /**
   * Bound from the :id route parameter.
   */
  readonly id = input.required<string>();

  /**
   * Offers API.
   */
  private readonly api = inject(JobsApi);

  /**
   * Router, to close back onto the feed.
   */
  private readonly router = inject(Router);

  /**
   * Carries the viewed and favourite flags back to the row behind the panel.
   */
  private readonly patches = inject(JobPatchBus);

  /**
   * Ends the request with the component.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Wording of the language in use.
   */
  protected readonly t = inject(I18n).t;

  /**
   * True on phones, where the panel is a sheet that can be dragged away.
   */
  protected readonly compact = inject(Viewport).isCompact;

  /**
   * Scrolling region, reset to the top whenever another offer is opened.
   */
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  /**
   * The offer, null until loaded.
   */
  protected readonly job = signal<JobDetailDto | null>(null);

  /**
   * Error shown instead of the offer.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * True until the request settles.
   */
  protected readonly loading = signal(true);

  /**
   * How far the sheet has been pulled down, in pixels.
   */
  protected readonly dragOffset = signal(0);

  /**
   * True while a finger is on the sheet's handle.
   */
  protected readonly dragging = signal(false);

  /**
   * Where the current drag started, null when no drag is in progress.
   */
  private dragStart: number | null = null;

  /**
   * Place line: remote, unknown, region-only, or town with postal code.
   */
  protected readonly place = computed(() => {
    const job = this.job();
    return job ? detailPlaceLabel(job, this.t()) : '';
  });

  /**
   * Twin listings, shown by host rather than as raw URLs.
   */
  protected readonly alternatives = computed(() =>
    (this.job()?.alternativeUrls ?? []).map((url) => ({ url, label: hostLabel(url) })),
  );

  /**
   * Loads on every id change: the panel stays mounted while the reader moves down the feed.
   */
  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  /**
   * Back to the feed, keeping the tab in the URL.
   */
  protected close(): void {
    void this.router.navigate(['/'], { queryParamsHandling: 'preserve' });
  }

  /**
   * Stars or un-stars, updating only the flag locally.
   */
  protected toggleFavorite(): void {
    const current = this.job();
    if (!current) return;
    this.api
      .toggleFavorite(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.job.set({ ...current, isFavorite: summary.isFavorite });
          this.patches.publish(summary);
        },
      });
  }

  /**
   * Finger down on the handle: from here the sheet follows it.
   */
  protected startDrag(event: PointerEvent): void {
    if (!this.compact()) return;
    this.dragStart = event.clientY;
    this.dragging.set(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  /**
   * The sheet only ever follows downwards: pulling up does nothing.
   */
  protected moveDrag(event: PointerEvent): void {
    if (this.dragStart === null) return;
    this.dragOffset.set(Math.max(0, event.clientY - this.dragStart));
  }

  /**
   * Past the threshold the sheet closes, short of it it springs back.
   */
  protected endDrag(): void {
    if (this.dragStart === null) return;
    const dismissed = this.dragOffset() > DISMISS_DISTANCE_PX;
    this.dragStart = null;
    this.dragging.set(false);
    this.dragOffset.set(0);
    if (dismissed) this.close();
  }

  /**
   * Fetches one offer; the API marks it viewed, which the feed behind is told about.
   */
  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.job.set(null);
    this.scroller()?.nativeElement.scrollTo({ top: 0 });
    this.api
      .detail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.loading.set(false);
          this.patches.publish(job);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 404 ? this.t().detail.notFound : this.t().detail.loadFailed,
          );
          this.loading.set(false);
        },
      });
  }
}
