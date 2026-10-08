import type { IconName } from '../../../shared/icon/icon-name';
import type { ShellTab } from '../shell-tab';

/**
 * One entry of the tab strip: where it leads, how it reads, and how many offers are behind it.
 */
export interface JobTabItem {
  /**
   * Tab this entry selects.
   */
  tab: ShellTab;

  /**
   * Wording shown to the reader.
   */
  label: string;

  /**
   * Offers currently in that tab, null for a tab that does not list offers.
   */
  count: number | null;

  /**
   * Glyph, only drawn in the bottom bar.
   */
  icon: IconName;
}
