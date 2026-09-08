import type { JobTab } from '@job-finder/shared';

/**
 * Prisma filter selecting the offers of one tab. Hidden offers never show anywhere.
 */
export function tabWhere(tab: JobTab) {
  switch (tab) {
    case 'local':
      return { isRemote: false, isHidden: false };
    case 'remote':
      return { isRemote: true, isHidden: false };
    case 'favorites':
      return { isFavorite: true, isHidden: false };
  }
}
