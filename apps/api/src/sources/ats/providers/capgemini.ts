import { permanentFromLabel } from '../../../ingestion/classifier/detect-permanent.js';
import { getJson } from '../../get-json.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { CapgeminiJob } from './capgemini.types.js';

/**
 * Capgemini's own search API (undocumented, backs careers.capgemini.com). Location is free
 * text only, so the board is the office town and offers are pinned to it: the same ad
 * often lists a dozen French towns.
 */
export async function fetchCapgemini(company: CompanyConfig): Promise<RawJob[]> {
  const params = new URLSearchParams({
    page: '1',
    size: '100',
    country_code: 'fr-fr',
    search: company.board,
  });
  const body = await getJson<{ data?: CapgeminiJob[] }>(
    `https://cg-jobstream-api.azurewebsites.net/api/job-search?${params}`,
    TIMEOUT_MS,
  );

  return (body.data ?? [])
    .filter((job) => job.location?.includes(company.board))
    .map((job) => {
      const description = htmlToText(job.description);
      return {
        ...companyFields(company, 'Capgemini'),
        sourceId: `capgemini:${job.id}`,
        title: job.title,
        company: job.brand ?? company.name,
        companyDescription: null,
        description,
        hasFullDescription: Boolean(description),
        contractLabel: job.contract_type ?? null,
        isPermanent: permanentFromLabel(job.contract_type),
        salary: null,
        locationText: company.board,
        city: company.board,
        postalCode: null,
        latitude: null,
        longitude: null,
        isRemote: false,
        isLocationApproximate: false,
        url: job.apply_job_url,
        publishedAt: job.updated_at ? new Date(job.updated_at) : null,
      } satisfies RawJob;
    });
}
