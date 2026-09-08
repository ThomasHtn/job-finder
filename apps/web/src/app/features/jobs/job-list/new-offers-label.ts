/**
 * "1 nouvelle offre" / "3 nouvelles offres".
 */
export function newOffersLabel(count: number): string {
  if (count === 0) return 'Aucune nouvelle offre.';
  const plural = count > 1 ? 's' : '';
  return `${count} nouvelle${plural} offre${plural}.`;
}
