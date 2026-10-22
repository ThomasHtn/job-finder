import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  Service,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { filter, map } from 'rxjs';

import { JOB_ID_PARAM } from '@core/jobs/job-route.constants';
import { Viewport } from '@core/layout/viewport';

/**
 * The panel an offer opens into: which offer is open, and, on a phone where the panel is a sheet over
 * the feed, keeping the feed out of reach and giving the focus back to its opener. Provided by the
 * page that holds the panel.
 */
@Service({ autoProvided: false })
export class JobsSheet {
  /**
   * Tells which offer the URL has open.
   */
  private readonly router = inject(Router);

  /**
   * The feed's route, whose child is the open offer.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Page document, whose body is frozen behind an open sheet.
   */
  private readonly document = inject(DOCUMENT);

  /**
   * Schedules the focus handed back once the sheet has closed.
   */
  private readonly injector = inject(Injector);

  /**
   * True on phones, where the panel is a sheet.
   */
  private readonly compact = inject(Viewport).isCompact;

  /**
   * Id of the offer the URL has open, `null` when the panel is empty.
   */
  public readonly selectedId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.openOfferId()),
    ),
    { initialValue: this.openOfferId() },
  );

  /**
   * True while an offer is rendered in the panel.
   */
  public readonly detailOpen = signal(false);

  /**
   * True while the panel covers the feed as a sheet: what lies behind is then out of reach.
   */
  public readonly sheetOpen = computed(() => this.compact() && this.detailOpen());

  /**
   * The row link the reader pressed to open an offer, given the focus back when the sheet closes.
   */
  private opener: HTMLElement | null = null;

  /**
   * Freezes the page behind an open sheet, and unfreezes it with the page.
   */
  constructor() {
    effect(() => {
      this.document.body.classList.toggle('is-sheet-open', this.sheetOpen());
    });
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('is-sheet-open'));
  }

  /**
   * Notes what the reader pressed to open an offer, rather than guessing from the focus, which some
   * browsers do not move on a click.
   */
  public rememberOpener(opener: HTMLElement): void {
    this.opener = opener;
  }

  /**
   * An offer rendered in the panel.
   */
  public panelActivated(): void {
    this.detailOpen.set(true);
  }

  /**
   * The panel emptied; a closed sheet gives the focus back to its opener once the feed is reachable again.
   */
  public panelDeactivated(): void {
    const wasSheet = this.sheetOpen();
    const opener = this.opener;
    this.detailOpen.set(false);
    this.opener = null;
    if (wasSheet && opener) {
      afterNextRender(() => (opener.isConnected ? opener.focus() : undefined), {
        injector: this.injector,
      });
    }
  }

  /**
   * Id parameter of the detail route rendered in the panel, `null` while the panel is empty.
   */
  private openOfferId(): string | null {
    return this.route.snapshot.firstChild?.paramMap.get(JOB_ID_PARAM) ?? null;
  }
}
