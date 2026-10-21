import { Service, signal } from '@angular/core';

import type { JobSummary } from '@job-finder/contract';

/**
 * Carries an offer changed in the detail panel back to the feed behind it: opening an offer
 * marks it viewed, starring it flips the star, and both must show without reloading the list.
 */
@Service()
export class JobPatchBus {
  /**
   * Writable side of `lastPatch`.
   */
  private readonly patched = signal<JobSummary | null>(null);

  /**
   * Last offer changed elsewhere, `null` until one is.
   */
  public readonly lastPatch = this.patched.asReadonly();

  /**
   * Announces the new state of one offer.
   */
  public publish(job: JobSummary): void {
    this.patched.set(job);
  }
}
