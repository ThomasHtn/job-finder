import { fetchOk } from './fetch-ok.js';
import type { HttpOptions } from './http.types.js';

/**
 * GET returning the body as text, failing on any non-2xx status.
 */
export async function getText(url: string, options: HttpOptions): Promise<string> {
  const response = await fetchOk(url, {}, options);
  return response.text();
}
