import { permanentFromLabel } from '../../classifier/detect-permanent.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { toDate } from '../../to-date.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { GreenhouseJob } from './greenhouse.types.js';

/**
 * One Greenhouse posting into a RawJob; the content comes as escaped HTML.
 */
export function toRawJob(company: CompanyConfig, job: GreenhouseJob): RawJob {
  const description = htmlToText(job.content);
  const employmentType = job.metadata?.find((m) => /employment type/i.test(m.name))?.value;
  return {
    ...companyFields(company, 'Greenhouse'),
    sourceId: `greenhouse:${company.board}:${job.id}`,
    title: job.title,
    company: company.name,
    companyDescription: null,
    description,
    hasFullDescription: Boolean(description),
    contractLabel: employmentType ?? null,
    isPermanent: permanentFromLabel(employmentType),
    salary: null,
    locationText: job.location?.name ?? null,
    city: job.location?.name ?? null,
    postalCode: null,
    latitude: null,
    longitude: null,
    isRemote: /remote|t[ée]l[ée]travail/i.test(job.location?.name ?? ''),
    isLocationApproximate: false,
    url: job.absolute_url,
    publishedAt: toDate(job.first_published) ?? toDate(job.updated_at),
  };
}
