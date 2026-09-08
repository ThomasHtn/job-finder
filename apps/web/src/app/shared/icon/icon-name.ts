/**
 * Every glyph available under `public/icons`, one SVG file per entry.
 */
export const ICON_NAMES = [
  'star',
  'star-filled',
  'dismiss',
  'refresh',
  'back',
  'external',
  'info',
  'alert',
  'lock',
  'chevron-down',
  'pin',
  'remote',
] as const;

/**
 * Name of one of the available glyphs.
 */
export type IconName = (typeof ICON_NAMES)[number];
