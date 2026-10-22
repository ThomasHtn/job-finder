import { getJson } from '../../get-json.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { isFrance } from '../france-location.js';
import { toRawJob } from './ashby.mapper.js';
import type { AshbyJob } from './ashby.types.js';

/**
 * Ashby job-board API, keeping the French postings.
 */
export async function fetchAshby(company: CompanyConfig): Promise<RawJob[]> {
  const body = await getJson<{ jobs?: AshbyJob[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${company.board}`,
    { label: `Ashby ${company.board}`, timeoutMs: TIMEOUT_MS },
  );

  return (body.jobs ?? [])
    .filter((job) => isFrance(job.address?.postalAddress?.addressCountry, job.location))
    .map((job) => toRawJob(company, job));
}
