import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import type { SourceStatus } from '@job-finder/contract';

import { Clock } from '@core/date/clock';
import { Language } from '@core/i18n/language';

import { SyncLabelPipe } from '../sync-label/sync-label.pipe';
import { toSourceRow } from './source-board.utils';

/**
 * Every source, its health, the offers it holds and its recent runs.
 */
@Component({
  selector: 'app-source-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, SyncLabelPipe, TranslocoPipe],
  templateUrl: './source-board.html',
  styleUrl: './source-board.scss',
})
export class SourceBoard {
  /**
   * Statuses as the API orders them.
   */
  public readonly statuses = input.required<SourceStatus[]>();

  /**
   * Language in use, which the worded counts and the sync labels follow.
   */
  protected readonly language = inject(Language);

  /**
   * The current minute, so "last success" ages while the tab stays open.
   */
  protected readonly now = inject(Clock).now;

  /**
   * The sources as the board shows them, worded again on a language switch.
   */
  protected readonly rows = computed(() => {
    this.language.active();
    return this.statuses().map(toSourceRow);
  });
}
