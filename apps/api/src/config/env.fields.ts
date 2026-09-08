import { z } from 'zod';

/**
 * "true"/"false" string, defaulting to false.
 */
export const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

/**
 * Optional credentials: a source with missing keys is skipped instead of failing the run.
 */
export const optionalSecret = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

/**
 * Comma-separated list; entries are trimmed and blanks dropped.
 */
export const csvList = z
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
export const requiredCsvList = csvList.pipe(
  z.array(z.string()).min(1, 'at least one entry'),
);

/**
 * "lat,lng" in decimal degrees.
 */
export const coordinates = z
  .string()
  .regex(/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/, 'expected "lat,lng"')
  .transform((value) => {
    const [latitude, longitude] = value.split(',').map(Number);
    return { latitude, longitude };
  });
