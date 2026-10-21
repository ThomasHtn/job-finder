import { permanentFromText } from '../classifier/detect-permanent.js';
import { htmlToText } from '../html-to-text.js';
import type { RawJob } from '../raw-job.js';
import { toDate } from '../to-date.js';
import { DETAILS_URL, DIRECT_HIRE } from './eures.constants.js';
import type { EuresJob } from './eures.types.js';

/**
 * EURES vacancy to the source-agnostic shape; the portal only locates offers by region,
 * so the configured area label stands in for the town.
 */
export function toRawJob(job: EuresJob, areaLabel: string): RawJob {
  const description = htmlToText(job.description);
  const isDirectHire = job.positionOfferingCode === DIRECT_HIRE;

  return {
    source: 'EURES',
    sourceId: job.id,
    sourceLabel: 'EURES',
    title: job.title,
    company: job.employer?.name ?? null,
    companyDescription: null,
    description,
    hasFullDescription: Boolean(description),
    contractLabel: isDirectHire ? 'Embauche directe' : (job.positionOfferingCode ?? null),
    /* A direct hire is permanent unless its text says otherwise. */
    isPermanent: isDirectHire && (permanentFromText(job.title, description ?? '') ?? true),
    salary: null,
    /* Only the region is known, so no geocoding is attempted. */
    locationText: null,
    city: areaLabel,
    postalCode: null,
    latitude: null,
    longitude: null,
    isRemote: false,
    isLocationApproximate: true,
    url: `${DETAILS_URL}/${job.id}?lang=fr`,
    publishedAt: toDate(job.creationDate),
  };
}
