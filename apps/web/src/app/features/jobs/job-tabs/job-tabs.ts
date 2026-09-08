import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { JobTab } from '@job-finder/shared';
import { Icon } from '../../../shared/icon/icon';
import type { JobTabItem } from './job-tab-item';

/**
 * The three tabs, in the header on a wide screen and in the bottom bar on a phone.
 */
@Component({
  selector: 'app-job-tabs',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-tabs.html',
  styleUrl: './job-tabs.scss',
  host: {
    role: 'tablist',
    '[class]': "'job-tabs job-tabs--' + variant()",
  },
})
export class JobTabs {
  /**
   * Entries to draw, in order.
   */
  readonly items = input.required<JobTabItem[]>();

  /**
   * Currently selected tab.
   */
  readonly current = input.required<JobTab>();

  /**
   * `inline` sits in the header, `bar` is fixed at the bottom of a phone screen.
   */
  readonly variant = input<'inline' | 'bar'>('inline');

  /**
   * Emits the tab the reader pressed.
   */
  readonly selected = output<JobTab>();
}
