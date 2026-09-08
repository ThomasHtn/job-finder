import { describe, expect, it } from 'vitest';
import type { SearchProfile } from '../config/search-profile.js';
import type { RawJob } from '../sources/source.types.js';
import {
  detectPermanent,
  detectRemote,
  isWanted,
  permanentFromLabel,
} from './classifier.js';

/**
 * Profile of the classifier specs, wider than the shared fixture on purpose.
 */
const PROFILE: SearchProfile = {
  keywords: ['développeur'],
  romeCode: null,
  titleInclude: [
    'developpeur',
    'developer',
    'ingenieur logiciel',
    'full stack',
  ],
  titleExclude: ['alternance', 'stage', 'business developer', 'commercial'],
  stackKeywords: ['angular', 'java', 'typescript', 'node.js', 'full stack'],
  area: {
    label: 'Seine-Maritime',
    center: { latitude: 49.4938, longitude: 0.1077 },
    driveMinutes: 55,
    city: 'Le Havre',
    insee: '76351',
    euresRegion: 'FRD2',
  },
};

/**
 * Raw offer with a matching title and nothing else.
 */
function job(overrides: Partial<RawJob>): RawJob {
  return {
    source: 'FRANCE_TRAVAIL',
    sourceId: '1',
    sourceLabel: 'France Travail',
    title: 'Développeur Full Stack H/F',
    company: 'Acme',
    companyDescription: null,
    description: null,
    hasFullDescription: true,
    contractLabel: null,
    isPermanent: null,
    salary: null,
    locationText: null,
    city: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    isRemote: false,
    isLocationApproximate: false,
    url: 'https://example.test',
    publishedAt: null,
    ...overrides,
  };
}

/**
 * Trade and stack matching.
 */
describe('isWanted', () => {
  it('keeps a developer role mentioning a wanted technology', () => {
    expect(
      isWanted(job({ description: 'Stack Angular et Java' }), PROFILE),
    ).toBe(true);
  });

  it('matches technologies in the title too', () => {
    expect(isWanted(job({ title: 'Développeur Angular (H/F)' }), PROFILE)).toBe(
      true,
    );
  });

  it('drops an ad that mentions none of the wanted technologies', () => {
    expect(
      isWanted(
        job({ title: 'Développeur PHP', description: 'Symfony, Laravel' }),
        PROFILE,
      ),
    ).toBe(false);
  });

  it('drops titles that are not developer roles', () => {
    expect(
      isWanted(job({ title: 'Chef de projet', description: 'Java' }), PROFILE),
    ).toBe(false);
  });

  it('drops excluded titles even when the stack matches', () => {
    expect(
      isWanted(job({ title: 'Développeur Java en alternance' }), PROFILE),
    ).toBe(false);
    expect(
      isWanted(
        job({ title: 'Business Developer', description: 'TypeScript' }),
        PROFILE,
      ),
    ).toBe(false);
  });

  it('ignores accents and case', () => {
    expect(isWanted(job({ title: 'DÉVELOPPEUR ANGULAR' }), PROFILE)).toBe(true);
  });

  it('does not let "java" match "javascript"', () => {
    expect(
      isWanted(
        job({ title: 'Développeur', description: 'JavaScript only' }),
        PROFILE,
      ),
    ).toBe(false);
  });

  it('matches keywords carrying punctuation', () => {
    expect(isWanted(job({ description: 'API Node.js' }), PROFILE)).toBe(true);
  });

  it('keeps a matching title when the source only gives a short truncated snippet', () => {
    expect(
      isWanted(
        job({
          title: 'Développeur Full Stack H/F',
          description: 'Poste basé à Rouen, à pourvoir rapidement.',
          hasFullDescription: false,
        }),
        PROFILE,
      ),
    ).toBe(true);
  });

  it('still requires the stack once the description is truncated but long enough to judge', () => {
    expect(
      isWanted(
        job({
          title: 'Développeur',
          description:
            'Poste au sein de notre agence, stack Symfony et Laravel, télétravail partiel, ambiance conviviale.',
          hasFullDescription: false,
        }),
        PROFILE,
      ),
    ).toBe(false);
  });
});

/**
 * Full-remote detection from the wording.
 */
describe('detectRemote', () => {
  it('trusts the source flag', () => {
    expect(detectRemote(job({ isRemote: true }))).toBe(true);
  });

  it('reads full remote wording in the text', () => {
    expect(
      detectRemote(job({ description: 'Poste en télétravail total.' })),
    ).toBe(true);
    expect(detectRemote(job({ description: '100% télétravail' }))).toBe(true);
    expect(detectRemote(job({ locationText: 'Full remote' }))).toBe(true);
  });

  it('ignores partial remote', () => {
    expect(
      detectRemote(
        job({ description: 'Télétravail possible 2 jours par semaine.' }),
      ),
    ).toBe(false);
  });

  it('ignores a negated mention', () => {
    expect(
      detectRemote(
        job({ description: 'PAS DE FULL REMOTE NI SOUS TRAITANCE MERCI' }),
      ),
    ).toBe(false);
    expect(
      detectRemote(job({ description: 'Poste sans télétravail total.' })),
    ).toBe(false);
    expect(
      detectRemote(job({ description: 'No full remote, hybrid only.' })),
    ).toBe(false);
  });

  it('keeps a mention that is not negated, even next to a negation', () => {
    expect(
      detectRemote(
        job({ description: 'Full remote possible, pas de déplacement.' }),
      ),
    ).toBe(true);
    expect(
      detectRemote(job({ description: "Pas d'astreinte. Télétravail total." })),
    ).toBe(true);
  });
});

/**
 * Contract labels of the ATS boards.
 */
describe('permanentFromLabel', () => {
  it('reads French and English permanent labels', () => {
    expect(permanentFromLabel('CDI')).toBe(true);
    expect(permanentFromLabel('Full-time')).toBe(true);
  });

  it('reads non-permanent labels', () => {
    expect(permanentFromLabel('Internship')).toBe(false);
    expect(permanentFromLabel('CDD')).toBe(false);
  });

  it('returns null when the label says nothing', () => {
    expect(permanentFromLabel('GE Employee')).toBeNull();
    expect(permanentFromLabel(null)).toBeNull();
  });
});

/**
 * Permanent-contract detection with text fallback.
 */
describe('detectPermanent', () => {
  it('trusts the source when it states the contract', () => {
    expect(detectPermanent(job({ isPermanent: true }))).toBe(true);
    expect(
      detectPermanent(job({ isPermanent: false, description: 'CDI' })),
    ).toBe(false);
  });

  it('falls back to the text otherwise', () => {
    expect(detectPermanent(job({ contractLabel: 'CDI' }))).toBe(true);
    expect(
      detectPermanent(
        job({ description: 'Contrat à durée déterminée de 6 mois' }),
      ),
    ).toBe(false);
    expect(detectPermanent(job({}))).toBe(false);
  });
});
