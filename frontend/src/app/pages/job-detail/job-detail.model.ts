/**
 * Another board publishing the same offer, named by its host.
 */
export interface AlternativeLink {
  /**
   * Full URL of the listing.
   */
  url: string;

  /**
   * Its hostname, without "www.".
   */
  label: string;
}
