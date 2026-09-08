import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.js';

/**
 * Smallest environment that passes validation.
 */
const MINIMAL = {
  DATABASE_URL: 'postgresql://localhost/test',
  SEARCH_KEYWORDS: ' développeur , full stack,,',
  SEARCH_TITLE_INCLUDE: 'developpeur',
  SEARCH_STACK_KEYWORDS: 'angular',
  SEARCH_AREA_LABEL: 'Seine-Maritime',
  SEARCH_AREA_CENTER: '49.4938, 0.1077',
  SEARCH_AREA_DRIVE_MINUTES: '55',
  SEARCH_AREA_CITY: 'Le Havre',
  SEARCH_AREA_INSEE: '76351',
  SEARCH_AREA_EURES_REGION: 'FRD2',
};

describe('validateEnv', () => {
  it('builds the search profile from comma-separated lists', () => {
    const env = validateEnv(MINIMAL);
    expect(env.searchProfile.keywords).toEqual(['développeur', 'full stack']);
    expect(env.searchProfile.titleExclude).toEqual([]);
    expect(env.searchProfile.romeCode).toBeNull();
    expect(env.searchProfile.area.center).toEqual({
      latitude: 49.4938,
      longitude: 0.1077,
    });
    expect(env.searchProfile.area.driveMinutes).toBe(55);
  });

  it('rejects an empty keyword list', () => {
    expect(() => validateEnv({ ...MINIMAL, SEARCH_KEYWORDS: ' , ' })).toThrow(
      /SEARCH_KEYWORDS/,
    );
  });

  it('applies the ingestion defaults', () => {
    const env = validateEnv(MINIMAL);
    expect(env.INGESTION_STALE_DAYS).toBe(30);
    expect(env.INGESTION_ON_STARTUP).toBe(false);
  });

  it('refuses a short password but accepts an absent one', () => {
    expect(() => validateEnv({ ...MINIMAL, APP_PASSWORD: 'abc' })).toThrow(
      /APP_PASSWORD/,
    );
    expect(validateEnv({ ...MINIMAL, APP_PASSWORD: '' }).APP_PASSWORD).toBeUndefined();
    expect(validateEnv({ ...MINIMAL, APP_PASSWORD: 'long-enough' }).APP_PASSWORD).toBe(
      'long-enough',
    );
  });

  it('rejects malformed coordinates', () => {
    expect(() =>
      validateEnv({ ...MINIMAL, SEARCH_AREA_CENTER: 'Le Havre' }),
    ).toThrow(/lat,lng/);
  });
});
