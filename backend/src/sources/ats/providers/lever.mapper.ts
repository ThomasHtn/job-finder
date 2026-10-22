import { permanentFromLabel } from '../../classifier/detect-permanent.js';
import type { RawJob } from '../../raw-job.js';
import { toDate } from '../../to-date.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { LeverJob } from './lever.types.js';

/**
 * One Lever posting into a RawJob; the text comes pre-flattened.
 */
export function toRawJob(company: CompanyConfig, job: LeverJob): RawJob {
  return {
    ...companyFields(company, 'Lever'),
    sourceId: `lever:${company.board}:${job.id}`,
    title: job.text,
    company: company.name,
    companyDescription: null,
    description: [job.descriptionPlain, job.additionalPlain].filter(Boolean).join('\n\n') || null,
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
    publishedAt: toDate(job.createdAt),
  };
}
