/**
 * The fields read from one item of a Talentsoft RSS feed.
 */
export interface TalentsoftItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  /**
   * Job family, contract, then address, in that order.
   */
  category?: string[];
}
