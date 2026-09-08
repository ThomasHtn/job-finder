/**
 * "Caen - 14" or "Île-de-France": keep the part before the department number.
 */
export function cityFromLieuTexte(label: string | undefined): string | null {
  if (!label) return null;
  const name = label.replace(/\s*-\s*\d{2,3}[AB]?\s*$/, '').trim();
  return name || null;
}
