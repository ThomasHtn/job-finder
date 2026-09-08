import { z } from 'zod';
import {
  booleanFromString,
  coordinates,
  csvList,
  optionalSecret,
  requiredCsvList,
} from './env.fields.js';
import type { SearchProfile } from './search-profile.js';

/**
 * Every variable read from the environment, before derivation.
 */
const rawSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),

  FT_CLIENT_ID: optionalSecret,
  FT_CLIENT_SECRET: optionalSecret,
  ADZUNA_APP_ID: optionalSecret,
  ADZUNA_APP_KEY: optionalSecret,
  ORS_API_KEY: optionalSecret,

  SEARCH_KEYWORDS: requiredCsvList,
  SEARCH_ROME_CODE: optionalSecret,
  SEARCH_TITLE_INCLUDE: requiredCsvList,
  SEARCH_TITLE_EXCLUDE: csvList,
  SEARCH_STACK_KEYWORDS: requiredCsvList,

  SEARCH_AREA_LABEL: z.string().min(1),
  SEARCH_AREA_CENTER: coordinates,
  SEARCH_AREA_DRIVE_KM: z.coerce.number().int().positive(),
  SEARCH_AREA_CITY: z.string().min(1),
  SEARCH_AREA_INSEE: z.string().min(1),
  SEARCH_AREA_EURES_REGIONS: requiredCsvList,
  SEARCH_AREA_APEC_LOCATION: z.string().min(1),
  SEARCH_AREA_FREE_WORK_LOCATIONS: requiredCsvList,

  INGESTION_CRON: z.string().default('0 0 */2 * * *'),
  INGESTION_ON_STARTUP: booleanFromString,
  /**
   * Offers not seen for this many days are purged, favourites excepted.
   */
  INGESTION_STALE_DAYS: z.coerce.number().int().positive().default(30),
});

/**
 * The SEARCH_* variables are exposed as one typed object, see `SearchProfile`.
 */
export const envSchema = rawSchema.transform((raw) => ({
  ...raw,
  searchProfile: {
    keywords: raw.SEARCH_KEYWORDS,
    romeCode: raw.SEARCH_ROME_CODE ?? null,
    titleInclude: raw.SEARCH_TITLE_INCLUDE,
    titleExclude: raw.SEARCH_TITLE_EXCLUDE,
    stackKeywords: raw.SEARCH_STACK_KEYWORDS,
    area: {
      label: raw.SEARCH_AREA_LABEL,
      center: raw.SEARCH_AREA_CENTER,
      driveKm: raw.SEARCH_AREA_DRIVE_KM,
      city: raw.SEARCH_AREA_CITY,
      insee: raw.SEARCH_AREA_INSEE,
      euresRegions: raw.SEARCH_AREA_EURES_REGIONS,
      apecLocation: raw.SEARCH_AREA_APEC_LOCATION,
      freeWorkLocations: raw.SEARCH_AREA_FREE_WORK_LOCATIONS,
    },
  } satisfies SearchProfile,
}));

/**
 * Validated environment as injected through ConfigService.
 */
export type Env = z.infer<typeof envSchema>;
