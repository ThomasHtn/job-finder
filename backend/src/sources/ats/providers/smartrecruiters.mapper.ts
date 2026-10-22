import type { RawJob } from '../../raw-job.js';
import { toDate } from '../../to-date.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { SmartRecruitersPosting } from './smartrecruiters.types.js';

/**
 * One SmartRecruiters posting and its description (null when the detail call failed) into a RawJob.
 */
export function toRawJob(
  company: CompanyConfig,
  posting: SmartRecruitersPosting,
  description: string | null,
): RawJob {
  return {
    ...companyFields(company, 'SmartRecruiters'),
    sourceId: `smartrecruiters:${company.board}:${posting.id}`,
    title: posting.name,
    company: company.name,
    companyDescription: null,
    description,
    hasFullDescription: Boolean(description),
    contractLabel: posting.typeOfEmployment?.label ?? null,
    isPermanent: posting.typeOfEmployment?.id === 'permanent' ? true : null,
    salary: null,
    locationText: posting.location?.city ?? null,
    city: posting.location?.city ?? null,
    postalCode: posting.location?.postalCode ?? null,
    latitude: null,
    longitude: null,
    isRemote: posting.location?.remote === true,
    isLocationApproximate: false,
    url: `https://jobs.smartrecruiters.com/${company.board}/${posting.id}`,
    publishedAt: toDate(posting.releasedDate),
  };
}
