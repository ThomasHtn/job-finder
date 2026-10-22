import { getJson } from '../../get-json.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { isFrance } from '../france-location.js';
import { toRawJob } from './lever.mapper.js';
import type { LeverJob } from './lever.types.js';

/**
 * Lever postings API, keeping the French postings.
 */
export async function fetchLever(company: CompanyConfig): Promise<RawJob[]> {
  const jobs = await getJson<unknown>(
    `https://api.lever.co/v0/postings/${company.board}?mode=json`,
    { label: `Lever ${company.board}`, timeoutMs: TIMEOUT_MS },
  );
  if (!Array.isArray(jobs)) {
    throw new Error(`Lever ${company.board} answered something else than a list`);
  }

  return (jobs as LeverJob[])
    .filter((job) => job.country === 'FR' || isFrance(job.categories?.location))
    .map((job) => toRawJob(company, job));
}
