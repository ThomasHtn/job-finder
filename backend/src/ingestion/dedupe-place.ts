import { REMOTE_PLACE } from './ingestion.constants.js';

/**
 * Place that takes part in the similarity key: every remote offer shares one, wherever it is based.
 */
export function dedupePlace(isRemote: boolean, city: string | null): string | null {
  return isRemote ? REMOTE_PLACE : city;
}
