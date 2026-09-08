import type { Twin } from './ingestion.types.js';
import type { PreparedJob } from './job-preparer.types.js';

/**
 * Decides what a merge changes on the twin: richest description wins, every link is kept.
 */
export function planMerge(twin: Twin, job: PreparedJob) {
  const upgrade = job.hasFullDescription && !twin.hasFullDescription;
  const links = new Set([...twin.alternativeUrls, upgrade ? twin.url : job.url]);
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
