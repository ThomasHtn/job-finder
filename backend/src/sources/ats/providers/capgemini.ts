import { getJson } from '../../get-json.js';
import type { RawJob } from '../../raw-job.js';
import { ATS_PAGE_SIZE, CAPGEMINI_COUNTRY_CODE, FIRST_PAGE, TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './capgemini.mapper.js';
import type { CapgeminiJob } from './capgemini.types.js';

/**
 * Capgemini's own search API (undocumented, backs careers.capgemini.com). Location is free
 * text only, so the board is the office town and offers are pinned to it: the same ad
 * often lists a dozen French towns.
 */
export async function fetchCapgemini(company: CompanyConfig): Promise<RawJob[]> {
  const params = new URLSearchParams({
    page: FIRST_PAGE,
    size: String(ATS_PAGE_SIZE),
    country_code: CAPGEMINI_COUNTRY_CODE,
    search: company.board,
  });
  const body = await getJson<{ data?: CapgeminiJob[] }>(
    `https://cg-jobstream-api.azurewebsites.net/api/job-search?${params}`,
    { label: `Capgemini ${company.board}`, timeoutMs: TIMEOUT_MS },
  );

  return (body.data ?? [])
    .filter((job) => job.location?.includes(company.board))
    .map((job) => toRawJob(company, job));
}
