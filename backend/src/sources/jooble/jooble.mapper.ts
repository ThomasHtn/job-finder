import { permanentFromLabel } from '../classifier/detect-permanent.js';
import { htmlToText } from '../html-to-text.js';
import type { RawJob } from '../raw-job.js';
import { toDate } from '../to-date.js';
import type { JoobleJob } from './jooble.types.js';
import { joobleId } from './jooble-id.js';

/**
 * Jooble result to the source-agnostic shape.
 */
export function toRawJob(job: JoobleJob): RawJob {
  return {
    source: 'JOOBLE',
    sourceId: joobleId(job.link),
    sourceLabel: job.source ? `Jooble (${job.source})` : 'Jooble',
    title: htmlToText(job.title) ?? job.title,
    company: job.company || null,
    companyDescription: null,
    description: htmlToText(job.snippet),
    /* Jooble only exposes a snippet, shown as an excerpt. */
    hasFullDescription: false,
    contractLabel: job.type || null,
    isPermanent: permanentFromLabel(job.type),
    salary: job.salary || null,
    locationText: job.location || null,
    city: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    isRemote: false,
    isLocationApproximate: false,
    url: job.link,
    publishedAt: toDate(job.updated),
  };
}
