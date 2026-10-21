import type { JobTab } from '@job-finder/contract';

import type { Prisma } from '../generated/prisma/client.js';

/**
 * Prisma filter selecting the offers of one tab. Hidden offers never show anywhere.
 */
export function tabWhere(tab: JobTab): Prisma.JobWhereInput {
  switch (tab) {
    case 'local':
      return { isRemote: false, isHidden: false };
    case 'remote':
      return { isRemote: true, isHidden: false };
    case 'favorites':
      return { isFavorite: true, isHidden: false };
  }
}
