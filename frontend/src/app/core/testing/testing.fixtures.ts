import { ComponentFixture, TestBed } from '@angular/core/testing';

/**
 * Lets pending promises and resource effects run, then renders the fixture (or ticks the app when the
 * spec has no component).
 */
export async function settle(fixture?: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  if (fixture) {
    fixture.detectChanges();
  } else {
    TestBed.tick();
  }
}
