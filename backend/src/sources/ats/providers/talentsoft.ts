import { getText } from '../../get-text.js';
import type { RawJob } from '../../raw-job.js';
import { TALENTSOFT_FRENCH_LCID, TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { FEED_PARSER } from './talentsoft.constants.js';
import { toRawJob } from './talentsoft.mapper.js';
import type { TalentsoftFeed } from './talentsoft.types.js';
import { resolveLink } from './talentsoft-link.js';

/**
 * Talentsoft RSS feed; the board is the career site host, the filter its feed criteria.
 * The feed stops at 20 items, so it must be narrowed (region, job family) to the area.
 */
export async function fetchTalentsoft(company: CompanyConfig): Promise<RawJob[]> {
  const filter = company.filter ? `&${company.filter}` : '';
  const xml = await getText(
    `https://${company.board}/handlers/offerRss.ashx?LCID=${TALENTSOFT_FRENCH_LCID}${filter}`,
    { label: `Talentsoft ${company.board}`, timeoutMs: TIMEOUT_MS },
  );

  const feed = FEED_PARSER.parse(xml) as TalentsoftFeed;
  const items = feed.rss?.channel?.item ?? [];

  return items.flatMap((item) => {
    const link = resolveLink(item.link, company.board);
    return item.title && link ? [toRawJob(company, { ...item, title: item.title }, link)] : [];
  });
}
