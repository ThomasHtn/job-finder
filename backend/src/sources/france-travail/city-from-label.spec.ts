import { describe, expect, it } from 'vitest';

import { cityFromLabel } from './city-from-label.js';

/**
 * Town name of a France Travail location label.
 */
describe('cityFromLabel', () => {
  it('drops the department number and title-cases an uppercased name', () => {
    expect(cityFromLabel('76 - LE HAVRE')).toBe('Le Havre');
    expect(cityFromLabel('974 - SAINT-DENIS')).toBe('Saint-Denis');
    expect(cityFromLabel("14 - BRETTEVILLE-L'ORGUEILLEUSE")).toBe("Bretteville-L'Orgueilleuse");
  });

  it('understands the Corsican departments', () => {
    expect(cityFromLabel('2A - AJACCIO')).toBe('Ajaccio');
    expect(cityFromLabel('2B - BASTIA')).toBe('Bastia');
  });

  it('keeps a mixed-case name as it is', () => {
    expect(cityFromLabel('Le Havre')).toBe('Le Havre');
  });

  it('answers null when there is no name', () => {
    expect(cityFromLabel(undefined)).toBeNull();
    expect(cityFromLabel('76 - ')).toBeNull();
  });
});
