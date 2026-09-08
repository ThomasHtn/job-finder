/**
 * Labels come as "76 - LE HAVRE" or plain "Le Havre"; keep only the town name.
 */
export function cityFromLabel(label: string | undefined): string | null {
  if (!label) return null;
  const name = label.replace(/^\s*\d{2,3}\s*-\s*/, '').trim();
  if (!name) return null;
  /* Most labels are fully uppercased, which reads badly in the UI. */
  return name === name.toUpperCase()
    ? name
        .toLowerCase()
        .replace(
          /(^|[\s'-])([a-zà-ÿ])/g,
          (_, sep: string, char: string) => sep + char.toUpperCase(),
        )
    : name;
}
