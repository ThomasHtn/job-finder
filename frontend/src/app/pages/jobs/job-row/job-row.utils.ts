import { DEFAULT_CONTRACT } from './job-row.constants';

/**
 * Contract wording worth a slot in the row: every offer here is permanent, so only another wording is.
 */
export function unusualContract(label: string | null): string | null {
  return label && label.toUpperCase() !== DEFAULT_CONTRACT ? label : null;
}
