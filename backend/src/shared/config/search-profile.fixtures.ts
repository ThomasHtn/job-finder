import type { SearchProfile } from './search-profile.js';

/**
 * Profile used by the specs. Not shipped: only imported by *.spec.ts.
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
    driveKm: 55,
    city: 'Le Havre',
    insee: '76351',
    euresRegions: ['FRD2'],
    apecLocation: '801',
    freeWorkLocations: ['fr~normandie~~'],
  },
};
