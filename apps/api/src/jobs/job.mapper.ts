import type { JobDetail, JobSummary } from '@job-finder/shared';
import type { JobModel } from '../generated/prisma/models.js';

const EXCERPT_LENGTH = 220;

/** Flattens the description to a single line and cuts it on a word boundary. */
export function excerpt(description: string | null): string | null {
  if (!description) return null;
  const flat = description.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return flat;
  const cut = flat.lastIndexOf(' ', EXCERPT_LENGTH);
  return `${flat.slice(0, cut > 0 ? cut : EXCERPT_LENGTH)}…`;
}

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

export function toDetail(job: JobModel): JobDetail {
  return {
    ...toSummary(job),
    description: job.description,
    companyDescription: job.companyDescription,
  };
}
