/**
 * Dates come as strings or epoch milliseconds; an unparseable one is treated as missing, since an
 * Invalid Date would fail the whole source when the offer is saved.
 */
export function toDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
