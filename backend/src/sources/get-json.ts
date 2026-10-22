import { fetchOk } from './fetch-ok.js';
import type { HttpOptions } from './http.types.js';

/**
 * GET returning the parsed JSON body, failing on any non-2xx status. The shape is the caller's to
 * check when the board does not promise it.
 */
export async function getJson<T>(url: string, options: HttpOptions): Promise<T> {
  const response = await fetchOk(url, {}, options);
  return (await response.json()) as T;
}
