import { permanentFromLabel } from '../../ingestion/classifier/detect-permanent.js';
import { htmlToText } from '../html-to-text.js';
import type { RawJob } from '../raw-job.js';
import { joobleId } from './jooble-id.js';
import type { JoobleJob } from './jooble.types.js';

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
    /* Jooble only exposes a snippet, so the UI must link out. */
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
    publishedAt: job.updated ? new Date(job.updated) : null,
  };
}
