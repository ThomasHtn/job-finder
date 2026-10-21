import { validateCronExpression } from 'cron';
import { z } from 'zod';

/**
 * "true"/"false" string, with the value an unset variable takes.
 */
export function booleanFromString(defaultValue: boolean) {
  return z
    .enum(['true', 'false'])
    .default(String(defaultValue) as 'true' | 'false')
    .transform((value) => value === 'true');
}

/**
 * Optional text, blank meaning unset: a source with missing keys is skipped instead of failing.
 */
export const optionalString = z
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
export const requiredCsvList = csvList.pipe(z.array(z.string()).min(1, 'at least one entry'));

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

/**
 * Optional absolute URL: empty means the feature it enables is off.
 */
export const optionalUrl = optionalString.pipe(z.url().optional());

/**
 * Cron expression with seconds, checked by the scheduler's own parser so a typo fails at startup.
 */
export const cronExpression = z
  .string()
  .refine((value) => validateCronExpression(value).valid, 'expected a cron expression');
