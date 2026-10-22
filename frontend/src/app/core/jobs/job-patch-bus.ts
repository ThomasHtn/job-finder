import { Service, signal } from '@angular/core';

import type { JobSummary } from '@job-finder/contract';

/**
 * Carries the offers changed in the detail panel (viewed, starred) back to the feed behind it, so
 * neither needs a reload. It keeps the latest state of every offer touched, never just the last one,
 * so a change published before the list arrives, or twice in a row, is not lost. Provided by the page
 * that shows the feed, so the changes live and die with it.
 */
@Service({ autoProvided: false })
export class JobPatchBus {
  /**
   * Writable side of `patches`.
   */
  private readonly published = signal<ReadonlyMap<string, JobSummary>>(new Map());

  /**
   * Latest known state of every offer changed here, by offer id.
   */
  public readonly patches = this.published.asReadonly();

  /**
   * Announces the new state of one offer.
   */
  public publish(job: JobSummary): void {
    this.published.update((current) => new Map(current).set(job.id, job));
  }
}
