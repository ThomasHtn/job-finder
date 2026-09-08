import { permanentFromLabel } from '../../../ingestion/classifier/detect-permanent.js';
import { getJson } from '../../get-json.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import { isFrance } from '../france-location.js';
import type { LeverJob } from './lever.types.js';

/**
 * Lever postings API; text comes pre-flattened.
 */
export async function fetchLever(company: CompanyConfig): Promise<RawJob[]> {
  const jobs = await getJson<LeverJob[]>(
    `https://api.lever.co/v0/postings/${company.board}?mode=json`,
    TIMEOUT_MS,
  );

  return jobs
    .filter((job) => job.country === 'FR' || isFrance(job.categories?.location))
    .map((job) => ({
      ...companyFields(company, 'Lever'),
      sourceId: `lever:${company.board}:${job.id}`,
      title: job.text,
      company: company.name,
      companyDescription: null,
      description:
        [job.descriptionPlain, job.additionalPlain]
          .filter(Boolean)
          .join('\n\n') || null,
      hasFullDescription: Boolean(job.descriptionPlain),
      contractLabel: job.categories?.commitment ?? null,
      isPermanent: permanentFromLabel(job.categories?.commitment),
      salary: null,
      locationText: job.categories?.location ?? null,
      city: job.categories?.location ?? null,
      postalCode: null,
      latitude: null,
      longitude: null,
      isRemote: job.workplaceType === 'remote',
      isLocationApproximate: false,
      url: job.hostedUrl,
      publishedAt: job.createdAt ? new Date(job.createdAt) : null,
    }));
}
