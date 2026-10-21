import { linkedSignal, Resource, WritableSignal } from '@angular/core';

/**
 * Resource value, or `fallback` while it has none.
 * Always read through this: `value()` throws once the resource is in error, even with a default.
 */
export function resourceValue<T, F>(resource: Resource<T>, fallback: F): T | F {
  return resource.hasValue() ? resource.value() : fallback;
}

/**
 * Last value the resource loaded, kept while it loads a new request or fails, so a screen never
 * blanks between two answers; writable, to patch it in place after a change made elsewhere.
 */
export function lastValue<T>(resource: Resource<T | undefined>, fallback: T): WritableSignal<T> {
  return linkedSignal<T | undefined, T>({
    source: () => resourceValue(resource, undefined),
    computation: (next, previous) => next ?? previous?.value ?? fallback,
  });
}
