import type { JobDetail, JobSummary } from '@job-finder/contract';

import type { JobModel } from '../generated/prisma/models.js';
import { matchedStack } from './matched-stack.js';

/**
 * Prisma row to the list DTO: dates become ISO strings, title and description the stack they name.
 */
export function toSummary(job: JobModel, stackKeywords: readonly string[]): JobSummary {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    city: job.city,
    postalCode: job.postalCode,
    isRemote: job.isRemote,
    isLocationApproximate: job.isLocationApproximate,
    sourceLabel: job.sourceLabel,
    url: job.url,
    hasFullDescription: job.hasFullDescription,
    contractLabel: job.contractLabel,
    salary: job.salary,
    stack: matchedStack(`${job.title} ${job.description ?? ''}`, stackKeywords),
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
export function toDetail(job: JobModel, stackKeywords: readonly string[]): JobDetail {
  return {
    ...toSummary(job, stackKeywords),
    description: job.description,
    companyDescription: job.companyDescription,
  };
}
