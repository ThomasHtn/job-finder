/**
 * Every glyph of `public/assets/icons`, one single-colour SVG file per entry; keep both in step.
 */
export const ICON_NAMES = [
  'star',
  'star-filled',
  'dismiss',
  'refresh',
  'external',
  'info',
  'alert',
  'chevron-down',
  'pin',
  'remote',
  'pulse',
] as const;

/**
 * Name of one of the available glyphs.
 */
export type IconName = (typeof ICON_NAMES)[number];
