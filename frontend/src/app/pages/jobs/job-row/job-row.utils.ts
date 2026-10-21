import { DEFAULT_CONTRACT } from './job-row.constants';

/**
 * Local midnight of the date, as a timestamp.
 */
export function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Contract wording worth a slot in the row: every offer here is permanent, so only another wording is.
 */
export function unusualContract(label: string | null): string | null {
  return label && label.toUpperCase() !== DEFAULT_CONTRACT ? label : null;
}
