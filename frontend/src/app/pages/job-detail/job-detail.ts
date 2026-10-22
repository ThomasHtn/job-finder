import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  afterRenderEffect,
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

import type { ActionFailure } from '@core/http/action-failure.model';
import { actionFailureText } from '@core/http/action-failure.utils';
import { API_ENDPOINTS } from '@core/http/api-endpoints';
import { isNotFound } from '@core/http/api-error.utils';
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
    '[attr.role]': "compact() ? 'dialog' : null",
    '[attr.aria-modal]': "compact() ? 'true' : null",
    '[attr.aria-label]': 'compact() ? panelLabel() : null',
    '(document:keydown.escape)': 'closeOnEscape($event)',
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
   * Why the last star failed; cleared when another offer opens.
   */
  private readonly actionFailure = signal<ActionFailure | null>(null);

  /**
   * That failure in the active language, above the offer.
   */
  protected readonly actionError = computed(() => {
    this.language.active();
    const failure = this.actionFailure();
    return failure ? actionFailureText(failure) : null;
  });

  /**
   * Name of the sheet for assistive tech: the offer's title once known.
   */
  protected readonly panelLabel = computed(() => {
    this.language.active();
    return this.job()?.title ?? translate('detail.loading');
  });

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
   * out of reach: when it opens, and when a narrowing window turns the column into one.
   */
  constructor() {
    afterRenderEffect(() => {
      if (this.compact()) {
        this.closeButton()?.nativeElement.focus();
      }
    });
    effect(() => {
      this.id();
      untracked(() => {
        this.actionFailure.set(null);
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
      const patch = this.patches.patches().get(this.id());
      if (patch) {
        untracked(() => this.setFavorite(patch.id, patch.isFavorite));
      }
    });
  }

  /**
   * Back to the feed, keeping the tab in the URL. The offer's history entry is replaced, so Back does
   * not reopen the offer just closed.
   */
  protected close(): void {
    void this.router.navigate(['/'], { queryParamsHandling: 'preserve', replaceUrl: true });
  }

  /**
   * Escape closes the offer, unless something open on top of it, like the settings menu, already took
   * the key.
   */
  protected closeOnEscape(event: Event): void {
    if (!event.defaultPrevented) {
      this.close();
    }
  }

  /**
   * Stars or un-stars through the patch bus: the flag here and the row behind both follow it.
   */
  protected async toggleFavorite(): Promise<void> {
    const current = this.job();
    if (!current) {
      return;
    }
    this.actionFailure.set(null);
    try {
      this.patches.publish(await this.jobsApi.setFavorite(current.id, !current.isFavorite));
    } catch (error: unknown) {
      this.actionFailure.set({ key: 'feed.favoriteFailed', cause: error });
    }
  }

  /**
   * Flips the star of the offer shown, only if it is still `id`: the patch may concern another offer.
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
