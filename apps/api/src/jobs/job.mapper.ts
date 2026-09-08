import type { JobDetail, JobSummary } from '@job-finder/shared';
import type { JobModel } from '../generated/prisma/models.js';
import { excerpt } from './excerpt.js';

/**
 * Prisma row to the list DTO: dates become ISO strings, the description an excerpt.
 */
export function toSummary(job: JobModel): JobSummary {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    city: job.city,
    postalCode: job.postalCode,
    isRemote: job.isRemote,
    isLocationApproximate: job.isLocationApproximate,
    source: job.source,
    sourceLabel: job.sourceLabel,
    url: job.url,
    hasFullDescription: job.hasFullDescription,
    contractLabel: job.contractLabel,
    salary: job.salary,
    excerpt: excerpt(job.description),
    isFavorite: job.isFavorite,
    isViewed: job.isViewed,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    firstSeenAt: job.firstSeenAt.toISOString(),
    alternativeUrls: job.alternativeUrls,
  };
}

/**
 * Prisma row to the detail DTO: the summary plus the full texts.
 */
export function toDetail(job: JobModel): JobDetail {
  return {
    ...toSummary(job),
    description: job.description,
    companyDescription: job.companyDescription,
  };
}
