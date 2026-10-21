import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icon } from '@shared/icon/icon';

import { JobTabItem, ShellTab } from '../jobs.model';
import { JobTabsVariant } from './job-tabs.model';

/**
 * The tabs, in the header on a wide screen and in the bottom bar on a phone. Each one is a navigation
 * through the URL (`?tab=`), not a tab panel: a landmark with the current entry marked, not a tablist.
 */
@Component({
  selector: 'app-job-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './job-tabs.html',
  styleUrl: './job-tabs.scss',
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'label()',
    '[class]': "'job-tabs job-tabs--' + variant()",
  },
})
export class JobTabs {
  /**
   * Name of the landmark, read by screen readers.
   */
  public readonly label = input.required<string>();

  /**
   * Entries to draw, in order.
   */
  public readonly items = input.required<JobTabItem[]>();

  /**
   * Currently selected tab.
   */
  public readonly current = input.required<ShellTab>();

  /**
   * `inline` sits in the header, `bar` is fixed at the bottom of a phone screen.
   */
  public readonly variant = input<JobTabsVariant>('inline');

  /**
   * Emits the tab the reader pressed.
   */
  public readonly selected = output<ShellTab>();
}
