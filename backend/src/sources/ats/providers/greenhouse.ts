import { getJson } from '../../get-json.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { isFrance, mentionsForeignCountry } from '../france-location.js';
import { toRawJob } from './greenhouse.mapper.js';
import type { GreenhouseJob } from './greenhouse.types.js';

/**
 * Greenhouse board API, keeping the French postings.
 */
export async function fetchGreenhouse(company: CompanyConfig): Promise<RawJob[]> {
  const body = await getJson<{ jobs?: GreenhouseJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${company.board}/jobs?content=true`,
    { label: `Greenhouse ${company.board}`, timeoutMs: TIMEOUT_MS },
  );

  return (body.jobs ?? []).filter(isFrenchPosting).map((job) => toRawJob(company, job));
}

/**
 * Whether a posting is in France, trusting the declared country over the office list.
 */
function isFrenchPosting(job: GreenhouseJob): boolean {
  if (mentionsForeignCountry(job.location?.name)) return false;
  /*
   * When the board declares a country, trust it: the location string often
   * lists several offices, including foreign ones.
   */
  const country = job.metadata?.find((m) => /country/i.test(m.name))?.value;
  return country ? isFrance(country) : isFrance(job.location?.name);
}
