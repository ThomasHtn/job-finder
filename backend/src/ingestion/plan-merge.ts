import type { Prisma } from '../generated/prisma/client.js';
import type { PreparedJob, Twin } from './ingestion.types.js';

/**
 * Decides what a merge changes on the twin: richest description wins, every link is kept.
 */
export function planMerge(twin: Twin, job: PreparedJob): Prisma.JobUpdateInput {
  const upgrade = job.hasFullDescription && !twin.hasFullDescription;
  const links = new Set([
    ...twin.alternativeUrls,
    ...(job.alternativeUrls ?? []),
    upgrade ? twin.url : job.url,
  ]);
  links.delete(upgrade ? job.url : twin.url);

  return {
    alternativeUrls: [...links],
    ...(upgrade
      ? {
          url: job.url,
          description: job.description,
          hasFullDescription: true,
          sourceLabel: job.sourceLabel,
        }
      : {}),
  };
}
