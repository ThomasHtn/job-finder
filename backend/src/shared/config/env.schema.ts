import { z } from 'zod';

import {
  booleanFromString,
  coordinates,
  cronExpression,
  csvList,
  optionalString,
  optionalUrl,
  requiredCsvList,
} from './env.fields.js';
import type { SearchProfile } from './search-profile.js';

/**
 * Every variable read from the environment, before derivation.
 */
const rawSchema = z.object({
  /**
   * "production" makes the auth fail closed: an app without a password is refused.
   */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  /**
   * Comma-separated origins allowed to call the API, the dev app's by default.
   */
  CORS_ORIGIN: csvList.default(['http://localhost:4201']),

  FT_CLIENT_ID: optionalString,
  FT_CLIENT_SECRET: optionalString,
  ADZUNA_APP_ID: optionalString,
  ADZUNA_APP_KEY: optionalString,
  JOOBLE_API_KEY: optionalString,
  ORS_API_KEY: optionalString,

  SEARCH_KEYWORDS: requiredCsvList,
  SEARCH_ROME_CODE: optionalString,
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

  INGESTION_CRON: cronExpression.default('0 0 */2 * * *'),
  INGESTION_ON_STARTUP: booleanFromString(false),
  /**
   * Offers not seen for this many days are purged, favourites excepted.
   */
  INGESTION_STALE_DAYS: z.coerce.number().int().positive().default(30),

  /**
   * Off only in development and the demo, where the browser tests sign in again and again.
   */
  LOGIN_THROTTLE_ENABLED: booleanFromString(true),
  /**
   * Uptime-kuma push monitor pinged after every run, up or down; empty turns it off.
   */
  INGESTION_HEARTBEAT_URL: optionalUrl,
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
