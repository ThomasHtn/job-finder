import { permanentFromLabel } from '../../../ingestion/classifier/detect-permanent.js';
import { getJson } from '../../get-json.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import { isFrance } from '../france-location.js';
import type { AshbyJob } from './ashby.types.js';

/**
 * Ashby job-board API; the address is structured when present.
 */
export async function fetchAshby(company: CompanyConfig): Promise<RawJob[]> {
  const body = await getJson<{ jobs?: AshbyJob[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${company.board}`,
    TIMEOUT_MS,
  );

  return (body.jobs ?? [])
    .filter((job) =>
      isFrance(job.address?.postalAddress?.addressCountry, job.location),
    )
    .map((job) => {
      const address = job.address?.postalAddress;
      return {
        ...companyFields(company, 'Ashby'),
        sourceId: `ashby:${company.board}:${job.id}`,
        title: job.title,
        company: company.name,
        companyDescription: null,
        description: job.descriptionPlain ?? null,
        hasFullDescription: Boolean(job.descriptionPlain),
        contractLabel: job.employmentType ?? null,
        isPermanent: permanentFromLabel(job.employmentType),
        salary: null,
        locationText: job.location ?? null,
        city: address?.addressLocality ?? job.location ?? null,
        postalCode: address?.postalCode ?? null,
        latitude: null,
        longitude: null,
        isRemote: job.isRemote === true || job.workplaceType === 'Remote',
        isLocationApproximate: false,
        url: job.jobUrl,
        publishedAt: job.publishedAt ? new Date(job.publishedAt) : null,
      } satisfies RawJob;
    });
}
