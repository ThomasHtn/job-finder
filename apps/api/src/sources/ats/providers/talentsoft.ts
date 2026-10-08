import { XMLParser } from 'fast-xml-parser';

import { permanentFromLabel } from '../../../ingestion/classifier/detect-permanent.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { TalentsoftItem } from './talentsoft.types.js';
import { stripReference, talentsoftReference } from './talentsoft-reference.js';

/**
 * Keeps every value a string and always yields lists for repeated tags.
 */
const parser = new XMLParser({
  parseTagValue: false,
  isArray: (tagName) => tagName === 'item' || tagName === 'category',
});

/**
 * Talentsoft RSS feed; the board is the career site host, the filter its feed criteria.
 * The feed stops at 20 items, so it must be narrowed (region, job family) to the area.
 */
export async function fetchTalentsoft(company: CompanyConfig): Promise<RawJob[]> {
  const filter = company.filter ? `&${company.filter}` : '';
  const response = await fetch(
    `https://${company.board}/handlers/offerRss.ashx?LCID=1036${filter}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!response.ok) {
    throw new Error(`${company.board} returned ${response.status}`);
  }

  const feed = parser.parse(await response.text()) as {
    rss?: { channel?: { item?: TalentsoftItem[] } };
  };
  const items = feed.rss?.channel?.item ?? [];

  return items
    .filter((item) => item.title && item.link)
    .map((item) => {
      const [, contract, address] = item.category ?? [];
      const description = htmlToText(item.description);
      return {
        ...companyFields(company, 'Talentsoft'),
        sourceId: `talentsoft:${company.board}:${talentsoftReference(item.link!)}`,
        title: stripReference(item.title!),
        company: company.name,
        companyDescription: null,
        description,
        hasFullDescription: Boolean(description),
        contractLabel: contract ?? null,
        isPermanent: permanentFromLabel(contract),
        salary: null,
        /* Sometimes a bare street with no town: the geocoder still resolves it. */
        locationText: address?.trim() || null,
        city: null,
        postalCode: null,
        latitude: null,
        longitude: null,
        isRemote: false,
        isLocationApproximate: false,
        url: item.link!,
        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      } satisfies RawJob;
    });
}
