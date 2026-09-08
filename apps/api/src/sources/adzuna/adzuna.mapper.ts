import type { RawJob } from '../raw-job.js';
import type { AdzunaJob } from './adzuna.types.js';
import { formatSalary } from './format-salary.js';

/**
 * Adzuna result to the source-agnostic shape; `isRemote` comes from the remote sweep.
 */
export function toRawJob(job: AdzunaJob, isRemote: boolean): RawJob {
  const areas = job.location?.area ?? [];

  return {
    source: 'ADZUNA',
    sourceId: job.id,
    sourceLabel: 'Adzuna',
    title: job.title,
    company: job.company?.display_name ?? null,
    companyDescription: null,
    description: job.description ?? null,
    /* Adzuna only exposes a truncated snippet, so the UI must link out. */
    hasFullDescription: false,
    contractLabel:
      job.contract_type === 'permanent' ? 'CDI' : (job.contract_type ?? null),
    isPermanent: job.contract_type === 'permanent',
    salary: formatSalary(job.salary_min, job.salary_max),
    locationText: job.location?.display_name ?? null,
    /* Adzuna orders areas from country down to the most precise level. */
    city: areas.at(-1) ?? job.location?.display_name ?? null,
    postalCode: null,
    latitude: job.latitude ?? null,
    longitude: job.longitude ?? null,
    isRemote,
    isLocationApproximate: false,
    url: job.redirect_url,
    publishedAt: job.created ? new Date(job.created) : null,
  };
}
