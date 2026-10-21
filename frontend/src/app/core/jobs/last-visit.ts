import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';

import { storageOf } from '@core/storage/storage.utils';

import { LAST_VISIT_STORAGE_KEY } from './jobs.constants';

/**
 * Snapshot of the previous visit's timestamp, taken once before it is overwritten with now.
 * Browser-local, like the language: nothing about it reaches the API.
 */
@Service()
export class LastVisit {
  /**
   * Remembers the visit, `null` when the browser blocks storage.
   */
  private readonly storage = storageOf(inject(DOCUMENT));

  /**
   * ISO timestamp of the previous visit, `null` on the very first one.
   */
  public readonly previousVisitAt: string | null =
    this.storage?.getItem(LAST_VISIT_STORAGE_KEY) ?? null;

  /**
   * Stamps the current visit right away, so a reload counts as a new visit.
   */
  constructor() {
    this.storage?.setItem(LAST_VISIT_STORAGE_KEY, new Date().toISOString());
  }
}
