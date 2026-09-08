import type { FR } from './fr';

/**
 * The wording every dictionary owes the UI. French is the reference shape: a key added there
 * fails the build of every other language until it is translated too.
 */
export type Translations = typeof FR;
