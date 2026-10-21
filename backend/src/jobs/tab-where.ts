import type { JobTab } from '@job-finder/contract';

import type { Prisma } from '../generated/prisma/client.js';

/**
 * Prisma filter selecting the offers of one tab.
 */
export function tabWhere(tab: JobTab): Prisma.JobWhereInput {
  switch (tab) {
    case 'local':
      return { isRemote: false };
    case 'remote':
      return { isRemote: true };
    case 'favorites':
      return { isFavorite: true };
  }
}
