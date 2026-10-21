import { TestBed } from '@angular/core/testing';

import { COMPACT_QUERY } from './layout.constants';
import { Viewport } from './viewport';

describe('Viewport', () => {
  /* jsdom has no matchMedia: whatever a test defines is removed after it. */
  afterEach(() => Reflect.deleteProperty(window, 'matchMedia'));

  it('assumes the wide shell where matchMedia is missing', () => {
    expect(TestBed.inject(Viewport).isCompact()).toBe(false);
  });

  it('follows the phone media query as the window is resized', () => {
    let onChange: ((event: { matches: boolean }) => void) | undefined;
    const query = {
      matches: true,
      addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
        onChange = listener;
      },
    };
    const matchMedia = vi.fn().mockReturnValue(query);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

    const viewport = TestBed.inject(Viewport);
    expect(matchMedia).toHaveBeenCalledWith(COMPACT_QUERY);
    expect(viewport.isCompact()).toBe(true);

    onChange?.({ matches: false });
    expect(viewport.isCompact()).toBe(false);
  });
});
