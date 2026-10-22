import { Logger } from '@nestjs/common';

import { getJson } from '../../get-json.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { ATS_PAGE_SIZE, TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { isFrance } from '../france-location.js';
import { DESCRIPTION_SECTIONS } from './smartrecruiters.constants.js';
import { toRawJob } from './smartrecruiters.mapper.js';
import type { SmartRecruitersDetail, SmartRecruitersPosting } from './smartrecruiters.types.js';

/**
 * SmartRecruiters postings API, one extra call per offer for the description.
 */
export async function fetchSmartRecruiters(company: CompanyConfig): Promise<RawJob[]> {
  /* Only the first page of postings comes back: a large board needs its `filter` to reach the area. */
  const filter = company.filter ? `&${company.filter}` : '';
  const body = await getJson<{ content?: SmartRecruitersPosting[] }>(
    `https://api.smartrecruiters.com/v1/companies/${company.board}/postings?limit=${ATS_PAGE_SIZE}${filter}`,
    { label: `SmartRecruiters ${company.board}`, timeoutMs: TIMEOUT_MS },
  );

  const french = (body.content ?? []).filter((posting) => isFrance(posting.location?.country));

  return Promise.all(
    french.map(async (posting) =>
      /* The listing has no description, so it needs one extra call per offer. */
      toRawJob(company, posting, await fetchDescription(company.board, posting.id)),
    ),
  );
}

/**
 * Concatenates the ad sections into plain text, null when the detail call fails.
 */
async function fetchDescription(board: string, postingId: string): Promise<string | null> {
  try {
    const detail = await getJson<SmartRecruitersDetail>(
      `https://api.smartrecruiters.com/v1/companies/${board}/postings/${postingId}`,
      { label: `SmartRecruiters ${board} posting`, timeoutMs: TIMEOUT_MS },
    );
    const sections = detail.jobAd?.sections ?? {};
    const text = DESCRIPTION_SECTIONS.map((key) => htmlToText(sections[key]?.text))
      .filter(Boolean)
      .join('\n\n');
    return text || null;
  } catch (error) {
    /* A missing description only costs the in-app detail view, not the offer. */
    Logger.warn(
      `${board} posting ${postingId} has no description: ${(error as Error).message}`,
      'SmartRecruiters',
    );
    return null;
  }
}
