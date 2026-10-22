import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { translate, TranslocoPipe } from '@jsverse/transloco';

import type { JobDetail } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';
import { describeHttpError, isNotFound } from '@core/http/api-error.utils';
import { resourceValue } from '@core/http/resource.utils';
import { Language } from '@core/i18n/language';
import { detailPlaceLabel } from '@core/jobs/job.utils';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { JobsApi } from '@core/jobs/jobs-api';
import { Viewport } from '@core/layout/viewport';
import { Button } from '@shared/button/button';
import { EmptyState } from '@shared/empty-state/empty-state';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { Notice } from '@shared/notice/notice';
import { ScanLine } from '@shared/scan-line/scan-line';
import { Skeleton } from '@shared/skeleton/skeleton';

import { DISMISS_DISTANCE_PX, PLACEHOLDER_TEXT_LINES } from './job-detail.constants';
import { AlternativeLink } from './job-detail.model';
import { hostLabel } from './job-detail.utils';
import { Prose } from './prose/prose';

/**
 * One offer, read next to the feed on a wide screen and as a sheet over it on a phone.
 */
@Component({
  selector: 'app-job-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    DatePipe,
    EmptyState,
    Icon,
    IconButton,
    Notice,
    Prose,
    ScanLine,
    Skeleton,
    TranslocoPipe,
  ],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss',
  host: {
    '[style.transform]': "dragOffset() ? 'translateY(' + dragOffset() + 'px)' : null",
    '[class.job-detail--dragging]': 'dragging()',
    '(document:keydown.escape)': 'close()',
  },
})
export class JobDetailPage {
  /**
   * Bound from the `:id` route parameter.
   */
  public readonly id = input.required<string>();

  /**
   * Stars the offer.
   */
  private readonly jobsApi = inject(JobsApi);

  /**
   * Closes back onto the feed.
   */
  private readonly router = inject(Router);

  /**
   * Carries the viewed and favourite flags back to the row behind the panel.
   */
  private readonly patches = inject(JobPatchBus);

  /**
   * Language in use, which the computed texts follow.
   */
  private readonly language = inject(Language);

  /**
   * True on phones, where the panel is a sheet that can be dragged away.
   */
  protected readonly compact = inject(Viewport).isCompact;

  /**
   * Scrolling region, reset to the top whenever another offer is opened.
   */
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  /**
   * The way back, focused when the panel opens as a sheet over the feed.
   */
  private readonly closeButton = viewChild<unknown, ElementRef<HTMLElement>>('closeButton', {
    read: ElementRef,
  });

  /**
   * The offer, fetched again on every id change: the panel stays mounted while the reader moves
   * down the feed. The API marks it viewed.
   */
  private readonly detail = httpResource<JobDetail>(() => API_ENDPOINTS.job(this.id()));

  /**
   * The offer as shown, `null` until loaded; the star is flipped here without fetching it again.
   */
  protected readonly job = linkedSignal(() => resourceValue(this.detail, null));

  /**
   * True until the request settles.
   */
  protected readonly loading = this.detail.isLoading;

  /**
   * One entry per line of text the placeholder draws.
   */
  protected readonly placeholderLines = Array.from(
    { length: PLACEHOLDER_TEXT_LINES },
    (_, index) => index,
  );

  /**
   * Message shown instead of the offer.
   */
  protected readonly error = computed(() => {
    this.language.active();
    const failure = this.detail.error();
    if (!failure) {
      return null;
    }
    return translate(isNotFound(failure) ? 'detail.notFound' : 'detail.loadFailed');
  });

  /**
   * Why the last star failed, above the offer; cleared when another offer opens.
   */
  protected readonly actionError = signal<string | null>(null);

  /**
   * How far the sheet has been pulled down, in pixels.
   */
  protected readonly dragOffset = signal(0);

  /**
   * True while a finger is on the sheet's handle.
   */
  protected readonly dragging = signal(false);

  /**
   * Where the current drag started, `null` when no drag is in progress.
   */
  private dragStart: number | null = null;

  /**
   * Place line: remote, unknown, region-only, or town with postal code.
   */
  protected readonly place = computed(() => {
    this.language.active();
    const job = this.job();
    return job ? detailPlaceLabel(job) : '';
  });

  /**
   * Twin listings, shown by host rather than as raw URLs.
   */
  protected readonly alternatives = computed<AlternativeLink[]>(() =>
    (this.job()?.alternativeUrls ?? []).map((url) => ({ url, label: hostLabel(url) })),
  );

  /**
   * Starts every offer at its top, tells the feed behind that the loaded one is now viewed, and
   * follows a star pressed on its row in the feed. A sheet takes the focus, the feed behind being
   * out of reach.
   */
  constructor() {
    afterNextRender(() => {
      if (this.compact()) {
        this.closeButton()?.nativeElement.focus();
      }
    });
    effect(() => {
      this.id();
      untracked(() => {
        this.actionError.set(null);
        this.scroller()?.nativeElement.scrollTo({ top: 0 });
      });
    });
    effect(() => {
      const loaded = resourceValue(this.detail, null);
      if (loaded) {
        untracked(() => this.patches.publish(loaded));
      }
    });
    effect(() => {
      const patch = this.patches.lastPatch();
      if (patch) {
        untracked(() => this.setFavorite(patch.id, patch.isFavorite));
      }
    });
  }

  /**
   * Back to the feed, keeping the tab in the URL.
   */
  protected close(): void {
    void this.router.navigate(['/'], { queryParamsHandling: 'preserve' });
  }

  /**
   * Stars or un-stars, updating only the flag here and, through the patch bus, on the row behind.
   */
  protected async toggleFavorite(): Promise<void> {
    const current = this.job();
    if (!current) {
      return;
    }
    this.actionError.set(null);
    try {
      const summary = await this.jobsApi.toggleFavorite(current.id);
      this.setFavorite(summary.id, summary.isFavorite);
      this.patches.publish(summary);
    } catch (error: unknown) {
      this.actionError.set(translate('feed.favoriteFailed', { detail: describeHttpError(error) }));
    }
  }

  /**
   * Flips the star of the offer shown, only if it is still `id`: the reader may have opened another
   * one while the request was on its way.
   */
  private setFavorite(id: string, isFavorite: boolean): void {
    this.job.update((job) => (job?.id === id ? { ...job, isFavorite } : job));
  }

  /**
   * Finger down on the handle: from here the sheet follows it.
   */
  protected startDrag(event: PointerEvent): void {
    if (!this.compact()) {
      return;
    }
    this.dragStart = event.clientY;
    this.dragging.set(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  /**
   * The sheet only ever follows downwards: pulling up does nothing.
   */
  protected moveDrag(event: PointerEvent): void {
    if (this.dragStart === null) {
      return;
    }
    this.dragOffset.set(Math.max(0, event.clientY - this.dragStart));
  }

  /**
   * Past the threshold the sheet closes, short of it it springs back.
   */
  protected endDrag(): void {
    if (this.dragStart === null) {
      return;
    }
    const dismissed = this.dragOffset() > DISMISS_DISTANCE_PX;
    this.dragStart = null;
    this.dragging.set(false);
    this.dragOffset.set(0);
    if (dismissed) {
      this.close();
    }
  }
}
