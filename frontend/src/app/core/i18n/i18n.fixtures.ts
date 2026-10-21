import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';

/**
 * Before each test of the calling spec: French plural rules on `<html lang>`, and a new French service
 * behind `translate()`, so pure functions read French whatever a previous spec of the worker switched
 * to. Its preload is awaited before TestBed is freed: settling after the reset, it would switch that
 * service to English.
 */
export function useFrenchTexts(): void {
  beforeEach(async () => {
    document.documentElement.lang = 'fr';
    TestBed.resetTestingModule();
    TestBed.inject(TranslocoService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    TestBed.resetTestingModule();
  });
}
