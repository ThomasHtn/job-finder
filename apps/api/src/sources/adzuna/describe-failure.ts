import { MAX_ERROR_LENGTH } from './adzuna.constants.js';

/**
 * Short, readable reason for a failed response: Adzuna's 5xx body is a whole HTML page.
 */
export async function describeFailure(response: Response): Promise<string> {
  const body = (await response.text()).trim();
  const detail = body.startsWith('<')
    ? 'HTML error page'
    : body.slice(0, MAX_ERROR_LENGTH);
  return `Adzuna search failed (${response.status}): ${detail}`;
}
