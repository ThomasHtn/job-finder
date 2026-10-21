import type { Logger } from '@nestjs/common';

/**
 * Keeps score of the searches of one fetch, so a failing search never costs the others while a
 * source whose every search failed still fails, and the ingestion reports it as down.
 */
export class SearchTally {
  /**
   * Searches that answered, even with no offer.
   */
  private succeeded = 0;

  /**
   * Errors of the searches that did not.
   */
  private readonly failures: Error[] = [];

  /**
   * Failures are warned about through the source's own logger.
   */
  constructor(private readonly logger: Logger) {}

  /**
   * Runs one search; a failure is recorded and answers an empty list.
   */
  public async run<T>(label: string, search: () => Promise<T[]>): Promise<T[]> {
    try {
      const results = await search();
      this.succeeded += 1;
      return results;
    } catch (error) {
      this.failures.push(error as Error);
      this.logger.warn(`Search ${label} skipped: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Throws the first failure when no search succeeded, so the run records the source as failed.
   */
  public throwIfAllFailed(): void {
    if (this.succeeded === 0 && this.failures.length > 0) throw this.failures[0];
  }
}
