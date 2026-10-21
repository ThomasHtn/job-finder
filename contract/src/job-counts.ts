/**
 * Number of offers behind each tab.
 */
export interface JobCounts {
  /**
   * On-site offers in the commuting area.
   */
  local: number;

  /**
   * Fully remote offers.
   */
  remote: number;

  /**
   * Starred offers.
   */
  favorites: number;
}
