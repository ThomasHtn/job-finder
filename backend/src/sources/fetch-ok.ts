import type { HttpOptions } from './http.types.js';

/**
 * Sends a request with a timeout and fails on any non-2xx status. The error names the call and the
 * status only: the URL may carry a key, and an error body may be a whole HTML page.
 */
export async function fetchOk(
  url: string,
  init: RequestInit,
  { label, timeoutMs, headers }: HttpOptions,
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${label} failed (${response.status})`);
  return response;
}
