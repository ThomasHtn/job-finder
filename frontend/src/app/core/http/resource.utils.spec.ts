import { resource, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { settle } from '@core/testing/testing.fixtures';

import { lastValue, resourceValue } from './resource.utils';

describe('resource utils', () => {
  it('reads a fallback while the resource has no value, the value once loaded', async () => {
    const loaded = TestBed.runInInjectionContext(() =>
      resource({ loader: () => Promise.resolve(3) }),
    );
    expect(resourceValue(loaded, 0)).toBe(0);
    await settle();
    expect(resourceValue(loaded, 0)).toBe(3);
  });

  it('reads the fallback of a failed resource instead of throwing', async () => {
    const failed = TestBed.runInInjectionContext(() =>
      resource({ loader: () => Promise.reject(new Error('down')) }),
    );
    await settle();
    expect(resourceValue(failed, 'none')).toBe('none');
  });

  it('keeps the last value while another request loads or fails', async () => {
    const answers = signal<() => Promise<string>>(() => Promise.resolve('first'));
    const { list, kept } = TestBed.runInInjectionContext(() => {
      const list = resource({ params: () => answers(), loader: ({ params }) => params() });
      return { list, kept: lastValue(list, 'empty') };
    });
    expect(kept()).toBe('empty');
    await settle();
    expect(kept()).toBe('first');

    answers.set(() => Promise.reject(new Error('down')));
    await settle();
    expect(list.status()).toBe('error');
    expect(kept()).toBe('first');

    kept.set('patched');
    expect(kept()).toBe('patched');
  });
});
