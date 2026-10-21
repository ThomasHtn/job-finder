/**
 * Local storage of the page, `null` when the browser blocks even reaching it (some private modes).
 */
export function storageOf(document: Document): Storage | null {
  try {
    return document.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Stores the value, or removes the key for `null`. A full or locked storage is ignored: what it
 * keeps is a convenience, and a throw here would break the service writing it.
 */
export function writeStorage(storage: Storage | null, key: string, value: string | null): void {
  try {
    if (value === null) {
      storage?.removeItem(key);
    } else {
      storage?.setItem(key, value);
    }
  } catch {
    /* Nothing to do: the value simply does not outlive the page. */
  }
}
