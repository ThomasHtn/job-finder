/**
 * Yearly range in euros, French formatting; null when the API gives nothing.
 */
export function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const format = (value: number) =>
    `${Math.round(value).toLocaleString('fr-FR')} €`;
  if (min && max && min !== max)
    return `${format(min)} - ${format(max)} par an`;
  return `${format((min ?? max)!)} par an`;
}
