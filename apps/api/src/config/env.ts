import { z } from 'zod';
import type { SearchProfile } from './search-profile.js';

/**
 * "true"/"false" string, defaulting to false.
 */
const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

/**
 * Optional credentials: a source with missing keys is skipped instead of failing the run.
 */
const optionalSecret = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

/**
 * Comma-separated list; entries are trimmed and blanks dropped.
 */
const csvList = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

/**
 * Comma-separated list that must hold at least one entry.
 */
const requiredCsvList = csvList.pipe(
  z.array(z.string()).min(1, 'at least one entry'),
);

/**
 * "lat,lng" in decimal degrees.
 */
const coordinates = z
  .string()
  .regex(/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/, 'expected "lat,lng"')
  .transform((value) => {
    const [latitude, longitude] = value.split(',').map(Number);
    return { latitude, longitude };
  });

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
  SEARCH_AREA_DRIVE_MINUTES: z.coerce.number().int().positive(),
  SEARCH_AREA_CITY: z.string().min(1),
  SEARCH_AREA_INSEE: z.string().min(1),
  SEARCH_AREA_EURES_REGION: z.string().min(1),

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
      driveMinutes: raw.SEARCH_AREA_DRIVE_MINUTES,
      city: raw.SEARCH_AREA_CITY,
      insee: raw.SEARCH_AREA_INSEE,
      euresRegion: raw.SEARCH_AREA_EURES_REGION,
    },
  } satisfies SearchProfile,
}));

/**
 * Validated environment as injected through ConfigService.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parses the environment and fails fast with every problem listed at once.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}
