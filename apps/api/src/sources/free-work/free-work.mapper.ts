import { toNumber } from '../../common/to-number.js';
import { htmlToText } from '../html-to-text.js';
import type { RawJob } from '../raw-job.js';
import {
  DEFAULT_JOB_SLUG,
  DETAIL_URL,
  FULL_REMOTE,
  PERMANENT,
} from './free-work.constants.js';
import type { FreeWorkJob } from './free-work.types.js';

/**
 * Free-Work offer to the source-agnostic shape.
 */
export function toRawJob(job: FreeWorkJob): RawJob {
  const place = job.location;
  const description = htmlToText(
    [job.description, job.candidateProfile].filter(Boolean).join('\n\n'),
  );

  return {
    source: 'FREE_WORK',
    sourceId: String(job.id),
    sourceLabel: 'Free-Work',
    title: job.title,
    company: job.company?.name ?? null,
    companyDescription: htmlToText(job.companyDescription),
    description,
    /* The search returns the whole ad, no detail call needed. */
    hasFullDescription: Boolean(description),
    contractLabel: job.contracts?.join(', ') ?? null,
    /* An offer open to both freelance and salaried carries the two labels. */
    isPermanent: job.contracts?.includes(PERMANENT) ?? null,
    salary: job.annualSalary ?? null,
    locationText: place?.label ?? null,
    /* Falls back to the coarser level so an area-wide offer still names a place. */
    city: place?.locality ?? place?.adminLevel2 ?? place?.adminLevel1 ?? null,
    postalCode: place?.postalCode ?? null,
    latitude: toNumber(place?.latitude),
    longitude: toNumber(place?.longitude),
    isRemote: job.remoteMode === FULL_REMOTE,
    /* Region-wide offers give the region centroid, which says nothing about the commute. */
    isLocationApproximate: Boolean(place) && !place?.locality,
    url: `${DETAIL_URL}/${job.job?.slug ?? DEFAULT_JOB_SLUG}/${job.slug}`,
    publishedAt: job.publishedAt ? new Date(job.publishedAt) : null,
  };
}
