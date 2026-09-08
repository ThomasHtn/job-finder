import { permanentFromLabel } from '../../../ingestion/classifier/detect-permanent.js';
import { getJson } from '../../get-json.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import { isFrance, mentionsForeignCountry } from '../france-location.js';
import type { GreenhouseJob } from './greenhouse.types.js';

/**
 * Greenhouse board API; content comes as escaped HTML.
 */
export async function fetchGreenhouse(
  company: CompanyConfig,
): Promise<RawJob[]> {
  const body = await getJson<{ jobs?: GreenhouseJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${company.board}/jobs?content=true`,
    TIMEOUT_MS,
  );

  return (body.jobs ?? [])
    .filter((job) => {
      if (mentionsForeignCountry(job.location?.name)) return false;
      /*
       * When the board declares a country, trust it: the location string often
       * lists several offices, including foreign ones.
       */
      const country = job.metadata?.find((m) => /country/i.test(m.name))?.value;
      return country ? isFrance(country) : isFrance(job.location?.name);
    })
    .map((job) => {
      const employmentType = job.metadata?.find((m) =>
        /employment type/i.test(m.name),
      )?.value;
      return {
        ...companyFields(company, 'Greenhouse'),
        sourceId: `greenhouse:${company.board}:${job.id}`,
        title: job.title,
        company: company.name,
        companyDescription: null,
        description: htmlToText(job.content),
        hasFullDescription: Boolean(job.content),
        contractLabel: employmentType ?? null,
        isPermanent: permanentFromLabel(employmentType),
        salary: null,
        locationText: job.location?.name ?? null,
        city: job.location?.name ?? null,
        postalCode: null,
        latitude: null,
        longitude: null,
        isRemote: /remote|t[ée]l[ée]travail/i.test(job.location?.name ?? ''),
        isLocationApproximate: false,
        url: job.absolute_url,
        publishedAt: job.first_published
          ? new Date(job.first_published)
          : job.updated_at
            ? new Date(job.updated_at)
            : null,
      } satisfies RawJob;
    });
}
