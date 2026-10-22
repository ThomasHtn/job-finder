import { permanentFromLabel } from '../../classifier/detect-permanent.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { toDate } from '../../to-date.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import type { TalentsoftItem } from './talentsoft.types.js';
import { stripReference, talentsoftReference } from './talentsoft-reference.js';

/**
 * One Talentsoft feed item, with its title and its absolute link, into a RawJob.
 */
export function toRawJob(
  company: CompanyConfig,
  item: TalentsoftItem & { title: string },
  link: string,
): RawJob {
  const [, contract, address] = item.category ?? [];
  const description = htmlToText(item.description);
  return {
    ...companyFields(company, 'Talentsoft'),
    sourceId: `talentsoft:${company.board}:${talentsoftReference(link)}`,
    title: stripReference(item.title),
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
    url: link,
    publishedAt: toDate(item.pubDate),
  };
}
