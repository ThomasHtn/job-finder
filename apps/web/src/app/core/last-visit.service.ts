import { Injectable } from '@angular/core';

/**
 * localStorage key of the last visit timestamp.
 */
const STORAGE_KEY = 'job-finder-last-visit';

/**
 * Snapshot of the previous visit's timestamp, taken once before it is overwritten with now.
 */
@Injectable({ providedIn: 'root' })
export class LastVisitService {
  /**
   * ISO timestamp of the previous visit, null on the very first one.
   */
  readonly previousVisitAt: string | null = localStorage.getItem(STORAGE_KEY);

  /**
   * Stamps the current visit right away, so a reload counts as a new visit.
   */
  constructor() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }
}
