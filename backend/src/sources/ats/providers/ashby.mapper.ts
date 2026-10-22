import { permanentFromLabel } from '../../classifier/detect-permanent.js';
import type { RawJob } from '../../raw-job.js';
import { toDate } from '../../to-date.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { AshbyJob } from './ashby.types.js';

/**
 * One Ashby posting into a RawJob; the address is structured when present.
 */
export function toRawJob(company: CompanyConfig, job: AshbyJob): RawJob {
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
    publishedAt: toDate(job.publishedAt),
  };
}
