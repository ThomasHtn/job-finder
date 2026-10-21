import type { Logger } from '@nestjs/common';

/**
 * How one paged search is walked and reported.
 */
export interface PagedSearch {
  /**
   * Names the search in the warning when it stops early.
   */
  label: string;

  /**
   * Pages read at most.
   */
  maxPages: number;

  /**
   * A shorter page is the last one.
   */
  pageSize: number;

  /**
   * Logger of the calling source.
   */
  logger: Logger;
}

/**
 * Reads pages until a short one or the cap. The first page failing fails the search; a later one
 * failing, status or network alike, keeps what was collected.
 */
export async function collectPages<T>(
  search: PagedSearch,
  fetchPage: (index: number) => Promise<T[]>,
): Promise<T[]> {
  const collected: T[] = [];

  for (let index = 0; index < search.maxPages; index += 1) {
    let results: T[];
    try {
      results = await fetchPage(index);
    } catch (error) {
      if (collected.length === 0) throw error;
      search.logger.warn(
        `Search ${search.label} stopped (${(error as Error).message}), keeping ${collected.length} offers`,
      );
      break;
    }
    collected.push(...results);
    if (results.length < search.pageSize) break;
  }

  return collected;
}
