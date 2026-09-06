import { describe, expect, it } from 'vitest';
import { computeDedupeHash } from './dedupe.js';

describe('computeDedupeHash', () => {
  it('matches the same offer republished with different gender markers', () => {
    expect(
      computeDedupeHash('Développeur Full Stack H/F', 'Acme', 'Le Havre'),
    ).toBe(
      computeDedupeHash('Developpeur Full Stack (x/f/m)', 'ACME', 'le havre'),
    );
  });

  it('separates different companies', () => {
    expect(computeDedupeHash('Développeur Java', 'Acme', 'Le Havre')).not.toBe(
      computeDedupeHash('Développeur Java', 'Globex', 'Le Havre'),
    );
  });

  it('separates the same role in different cities', () => {
    expect(computeDedupeHash('Développeur Java', 'Acme', 'Le Havre')).not.toBe(
      computeDedupeHash('Développeur Java', 'Acme', 'Rouen'),
    );
  });

  it('tolerates a missing company', () => {
    expect(computeDedupeHash('Développeur Java', null, 'Le Havre')).toBe(
      computeDedupeHash('Développeur  Java', null, 'Le Havre'),
    );
  });
});
