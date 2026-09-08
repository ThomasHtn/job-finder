import type { JobTab } from '@job-finder/shared';
import type { IconName } from '../../../shared/icon/icon-name';

/**
 * One entry of the tab strip: where it leads, how it reads, and how many offers are behind it.
 */
export interface JobTabItem {
  /**
   * Tab this entry selects.
   */
  tab: JobTab;

  /**
   * Wording shown to the reader.
   */
  label: string;

  /**
   * Offers currently in that tab.
   */
  count: number;

  /**
   * Glyph, only drawn in the bottom bar.
   */
  icon: IconName;
}
