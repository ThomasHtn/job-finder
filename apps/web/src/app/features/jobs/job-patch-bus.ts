import { Injectable, signal } from '@angular/core';
import type { JobSummary } from '@job-finder/shared';

/**
 * Carries an offer changed in the detail panel back to the feed behind it: opening an offer
 * marks it viewed, starring it flips the star, and both must show without reloading the list.
 */
@Injectable({ providedIn: 'root' })
export class JobPatchBus {
  /**
   * Writable side of the exposed signal.
   */
  private readonly patched = signal<JobSummary | null>(null);

  /**
   * Last offer changed elsewhere, null until one is.
   */
  readonly lastPatch = this.patched.asReadonly();

  /**
   * Announces the new state of one offer.
   */
  publish(job: JobSummary): void {
    this.patched.set(job);
  }
}
