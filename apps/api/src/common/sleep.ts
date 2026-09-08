/**
 * Promise-based pause, used to space out calls to rate-limited sources.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
