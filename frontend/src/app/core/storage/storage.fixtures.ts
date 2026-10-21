/**
 * Before each test of the calling spec: no stored token, language or last visit left by another spec.
 */
export function useCleanStorage(): void {
  beforeEach(() => localStorage.clear());
}
