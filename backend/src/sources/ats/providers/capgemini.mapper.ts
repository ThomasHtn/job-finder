import { permanentFromLabel } from '../../classifier/detect-permanent.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { toDate } from '../../to-date.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { CapgeminiJob } from './capgemini.types.js';

/**
 * One Capgemini result into a RawJob, pinned to the board's town.
 */
export function toRawJob(company: CompanyConfig, job: CapgeminiJob): RawJob {
  const description = htmlToText(job.description);
  return {
    ...companyFields(company, 'Capgemini'),
    /* One search per town: the board keeps an offer listed in two towns apart. */
    sourceId: `capgemini:${company.board}:${job.id}`,
    title: job.title,
    company: job.brand ?? company.name,
    companyDescription: null,
    description,
    hasFullDescription: Boolean(description),
    contractLabel: job.contract_type ?? null,
    isPermanent: permanentFromLabel(job.contract_type),
    salary: null,
    locationText: company.board,
    city: company.board,
    postalCode: null,
    latitude: null,
    longitude: null,
    isRemote: false,
    isLocationApproximate: false,
    url: job.apply_job_url,
    publishedAt: toDate(job.updated_at),
  };
}
