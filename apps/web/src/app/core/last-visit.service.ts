import { Injectable } from '@angular/core';

const STORAGE_KEY = 'job-finder-last-visit';

/** Snapshot of the previous visit's timestamp, taken once before it is overwritten with now. */
@Injectable({ providedIn: 'root' })
export class LastVisitService {
  readonly previousVisitAt: string | null = localStorage.getItem(STORAGE_KEY);

  constructor() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }
}
