import { fetchOk } from './fetch-ok.js';
import type { HttpOptions } from './http.types.js';

/**
 * POST of a JSON body returning the parsed JSON answer, failing on any non-2xx status.
 */
export async function postJson<T>(url: string, body: unknown, options: HttpOptions): Promise<T> {
  const response = await fetchOk(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    options,
  );
  return (await response.json()) as T;
}
