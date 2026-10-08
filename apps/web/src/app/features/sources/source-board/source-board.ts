import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { SourceStatus } from '@job-finder/shared';
import { I18n } from '../../../core/i18n/i18n.service';
import { SyncLabelPipe } from '../../jobs/sync-label.pipe';
import { sourceState } from '../source-state';

/**
 * Every source, its health, the offers it holds and its recent runs.
 */
@Component({
  selector: 'app-source-board',
  imports: [DatePipe, SyncLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-board.html',
  styleUrl: './source-board.scss',
})
export class SourceBoard {
  /**
   * Statuses as the API orders them.
   */
  readonly statuses = input.required<SourceStatus[]>();

  /**
   * Wording of the language in use.
   */
  protected readonly t = inject(I18n).t;

  /**
   * Exposed to the template, which words the state of each source.
   */
  protected readonly stateOf = sourceState;
}
