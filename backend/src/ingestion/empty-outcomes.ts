import type { OfferOutcome } from './ingestion.types.js';

/**
 * Fresh tally of what happened to the offers of one board, every outcome at zero.
 */
export function emptyOutcomes(): Record<OfferOutcome, number> {
  return { inserted: 0, updated: 0, merged: 0, skipped: 0, failed: 0 };
}
