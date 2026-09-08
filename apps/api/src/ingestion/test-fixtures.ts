import type { SearchProfile } from '../config/search-profile.js';
import type { RawJob } from '../sources/source.types.js';

/**
 * Profile used by the ingestion specs. Not shipped: only imported by *.spec.ts.
 */
export const PROFILE: SearchProfile = {
  keywords: ['développeur'],
  romeCode: null,
  titleInclude: ['developpeur', 'developer', 'full stack'],
  titleExclude: ['alternance', 'stage'],
  stackKeywords: ['angular', 'java'],
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
 * A raw offer that passes every filter of PROFILE, with overrides for the edge cases.
 */
export function rawJob(overrides: Partial<RawJob> = {}): RawJob {
  return {
    source: 'FRANCE_TRAVAIL',
    sourceId: '1',
    sourceLabel: 'France Travail',
    title: 'Développeur Full Stack H/F',
    company: 'Acme',
    companyDescription: null,
    description: 'Stack Angular et Java, CDI',
    hasFullDescription: true,
    contractLabel: 'CDI',
    isPermanent: true,
    salary: null,
    locationText: null,
    city: 'Le Havre',
    postalCode: '76600',
    latitude: 49.49,
    longitude: 0.11,
    isRemote: false,
    isLocationApproximate: false,
    url: 'https://example.test/1',
    publishedAt: null,
    ...overrides,
  };
}
