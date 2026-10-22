import { fetchOk } from './fetch-ok.js';
import type { HttpOptions } from './http.types.js';

/**
 * POST of a form body returning the parsed JSON answer, failing on any non-2xx status.
 */
export async function postForm<T>(
  url: string,
  form: URLSearchParams,
  options: HttpOptions,
): Promise<T> {
  const response = await fetchOk(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    },
    options,
  );
  return (await response.json()) as T;
}
