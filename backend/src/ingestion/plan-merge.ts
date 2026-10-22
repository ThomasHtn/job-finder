import type { Prisma } from '../generated/prisma/client.js';
import type { MergeMode, PreparedJob, Twin } from './ingestion.types.js';

/**
 * Whether the incoming offer takes the main link and text: the fuller description wins, and on a
 * tie the offer seen again refreshes its own row while a twin keeps what it has.
 */
function incomingLeads(current: Twin, job: PreparedJob, mode: MergeMode): boolean {
  return mode === 'refresh'
    ? !(current.hasFullDescription && !job.hasFullDescription)
    : job.hasFullDescription && !current.hasFullDescription;
}

/**
 * Whether the row's current link must outlive the merge as an alternative: always for a twin, and
 * for an own row only when another board's link was promoted onto it. Its own old link is dropped.
 */
function keepsCurrentLink(current: Twin, job: PreparedJob, mode: MergeMode): boolean {
  return mode === 'merge' || current.sourceLabel !== job.sourceLabel;
}

/**
 * The newer of the two dates, or undefined when the row already holds it (or none is known).
 */
function newerDate(current: Date | null, incoming: Date | null): Date | undefined {
  if (!incoming) return undefined;
  return !current || incoming > current ? incoming : undefined;
}

/**
 * Decides what meeting a duplicate changes on the row: richest description wins, every link is
 * kept, the newest publication date stands.
 */
export function planMerge(current: Twin, job: PreparedJob, mode: MergeMode): Prisma.JobUpdateInput {
  const leads = incomingLeads(current, job, mode);
  const links = new Set([...current.alternativeUrls, ...(job.alternativeUrls ?? []), job.url]);
  if (keepsCurrentLink(current, job, mode)) links.add(current.url);
  links.delete(leads ? job.url : current.url);

  return {
    alternativeUrls: [...links],
    publishedAt: newerDate(current.publishedAt, job.publishedAt),
    ...(leads
      ? {
          url: job.url,
          description: job.description,
          hasFullDescription: job.hasFullDescription,
          sourceLabel: job.sourceLabel,
        }
      : {}),
  };
}
