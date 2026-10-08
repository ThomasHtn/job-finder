/**
 * The fields read from one Lever posting.
 */
export interface LeverJob {
  /**
   * Posting id (UUID), unique within the board.
   */
  id: string;
  /**
   * Posting title.
   */
  text: string;
  /**
   * ISO 3166-1 alpha-2 code, e.g. "FR".
   */
  country?: string;
  /**
   * "onsite", "hybrid", "remote" or "unspecified".
   */
  workplaceType?: string;
  /**
   * Creation date, as epoch milliseconds.
   */
  createdAt?: number;
  /**
   * Public ad page on jobs.lever.co.
   */
  hostedUrl: string;
  /**
   * Main body of the ad as plain text.
   */
  descriptionPlain?: string;
  /**
   * Closing section of the ad as plain text, appended to the description.
   */
  additionalPlain?: string;
  /**
   * Board-defined labels: the location and the commitment, i.e. the contract.
   */
  categories?: { location?: string; commitment?: string };
}
