/**
 * A salary read out of a source's free text, in euros.
 */
export interface SalaryRange {
  /**
   * Lowest amount the text names.
   */
  min: number;

  /**
   * Highest amount, equal to `min` when the text names a single one.
   */
  max: number;

  /**
   * True for "from X": a floor rather than a figure.
   */
  from: boolean;

  /**
   * True for a monthly pay, which keeps its digits instead of thousands.
   */
  monthly: boolean;
}
