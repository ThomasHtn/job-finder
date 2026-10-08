import { describe, expect, it } from 'vitest';
import { toRawJob } from './france-travail.mapper.js';

/**
 * Mapping of a France Travail offer.
 */
describe('toRawJob (France Travail)', () => {
  it('keeps the partner board link of a relayed offer', () => {
    const job = toRawJob({
      id: '7777137',
      intitule: 'Développeur Java H/F',
      origineOffre: {
        urlOrigine: 'https://candidat.francetravail.fr/offres/recherche/detail/7777137',
        partenaires: [{ nom: 'TALENTPLUG', url: 'http://partner.test/offer' }, { nom: 'X' }],
      },
    });

    expect(job.url).toBe('https://candidat.francetravail.fr/offres/recherche/detail/7777137');
    expect(job.alternativeUrls).toEqual(['http://partner.test/offer']);
  });

  it('has no extra link for a native offer', () => {
    expect(toRawJob({ id: '212SWMM', intitule: 'Dev' }).alternativeUrls).toEqual([]);
  });
});
