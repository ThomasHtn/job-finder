/**
 * The fields read from one item of a Talentsoft RSS feed.
 */
export interface TalentsoftItem {
  /**
   * Ad title, prefixed with an internal reference such as "2026-10902 - ".
   */
  title?: string;
  /**
   * Public ad page; its `idOffre` parameter identifies the offer.
   */
  link?: string;
  /**
   * Ad body as HTML.
   */
  description?: string;
  /**
   * Publication date, in the RFC 822 format of RSS.
   */
  pubDate?: string;
  /**
   * Job family, contract, then address, in that order.
   */
  category?: string[];
}

/**
 * A Talentsoft RSS feed as parsed from XML: every level may be missing on an empty board.
 */
export interface TalentsoftFeed {
  /**
   * Root `<rss>` element, holding the single `<channel>` and its `<item>` list.
   */
  rss?: { channel?: { item?: TalentsoftItem[] } };
}
