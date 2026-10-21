import { storageOf, writeStorage } from './storage.utils';

/**
 * Storage stand-in whose every write fails, like a full quota or a locked private mode.
 */
function lockedStorage(): Storage {
  const fail = () => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError');
  };
  return {
    length: 0,
    clear: fail,
    getItem: () => null,
    key: () => null,
    removeItem: fail,
    setItem: fail,
  };
}

/**
 * Guarded access to the page's local storage.
 */
describe('storage utils', () => {
  beforeEach(() => localStorage.clear());

  it('reaches the local storage of the document', () => {
    expect(storageOf(document)).toBe(localStorage);
  });

  it('answers null when the browser blocks the storage itself', () => {
    const blocked = {
      get defaultView(): Window {
        throw new DOMException('Denied', 'SecurityError');
      },
    } as unknown as Document;

    expect(storageOf(blocked)).toBeNull();
  });

  it('writes a value and removes it on null', () => {
    writeStorage(localStorage, 'key', 'value');
    expect(localStorage.getItem('key')).toBe('value');

    writeStorage(localStorage, 'key', null);
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('ignores a storage that refuses writes, or none at all', () => {
    expect(() => writeStorage(lockedStorage(), 'key', 'value')).not.toThrow();
    expect(() => writeStorage(lockedStorage(), 'key', null)).not.toThrow();
    expect(() => writeStorage(null, 'key', 'value')).not.toThrow();
  });
});
