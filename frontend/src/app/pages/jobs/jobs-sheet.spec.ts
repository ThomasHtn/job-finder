import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Viewport } from '@core/layout/viewport';

import { JobsSheet } from './jobs-sheet';

describe('JobsSheet', () => {
  /**
   * Whether the layout is a phone's, set before each spec.
   */
  const compact = signal(true);

  /**
   * A row link standing in the page, which the reader presses.
   */
  let opener: HTMLAnchorElement;

  beforeEach(() => {
    compact.set(true);
    opener = document.createElement('a');
    opener.href = '#';
    document.body.append(opener);
    TestBed.configureTestingModule({
      providers: [
        JobsSheet,
        provideRouter([]),
        { provide: Viewport, useValue: { isCompact: compact } },
      ],
    });
  });

  afterEach(() => {
    opener.remove();
    document.body.classList.remove('is-sheet-open');
  });

  /**
   * Lets effects and render hooks run.
   */
  function tick(): void {
    TestBed.tick();
  }

  it('freezes the page behind an open sheet only', () => {
    const sheet = TestBed.inject(JobsSheet);
    tick();
    expect(document.body.classList).not.toContain('is-sheet-open');

    sheet.panelActivated();
    tick();
    expect(sheet.sheetOpen()).toBe(true);
    expect(document.body.classList).toContain('is-sheet-open');

    compact.set(false);
    tick();
    expect(sheet.sheetOpen()).toBe(false);
    expect(document.body.classList).not.toContain('is-sheet-open');
  });

  it('gives the focus back to what the reader pressed, once the sheet has closed', () => {
    const sheet = TestBed.inject(JobsSheet);
    sheet.rememberOpener(opener);
    sheet.panelActivated();
    tick();

    sheet.panelDeactivated();
    tick();

    expect(document.activeElement).toBe(opener);
  });

  it('leaves the focus alone when the panel was a column, or the opener is gone', () => {
    const sheet = TestBed.inject(JobsSheet);
    compact.set(false);
    sheet.rememberOpener(opener);
    sheet.panelActivated();
    sheet.panelDeactivated();
    tick();
    expect(document.activeElement).not.toBe(opener);

    compact.set(true);
    sheet.rememberOpener(opener);
    sheet.panelActivated();
    opener.remove();
    sheet.panelDeactivated();
    expect(() => tick()).not.toThrow();
  });

  it('forgets the opener once used, so a deep link does not reuse it', () => {
    const sheet = TestBed.inject(JobsSheet);
    sheet.rememberOpener(opener);
    sheet.panelActivated();
    sheet.panelDeactivated();
    tick();
    opener.blur();

    sheet.panelActivated();
    sheet.panelDeactivated();
    tick();

    expect(document.activeElement).not.toBe(opener);
  });

  it('starts without an offer open', async () => {
    await TestBed.inject(Router).navigateByUrl('/');

    expect(TestBed.inject(JobsSheet).selectedId()).toBeNull();
  });
});
