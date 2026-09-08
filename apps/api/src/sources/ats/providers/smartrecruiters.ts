import { getJson } from '../../get-json.js';
import { htmlToText } from '../../html-to-text.js';
import type { RawJob } from '../../raw-job.js';
import { TIMEOUT_MS } from '../ats.constants.js';
import type { CompanyConfig } from '../ats.types.js';
import { companyFields } from '../company-fields.js';
import { isFrance } from '../france-location.js';
import type {
  SmartRecruitersDetail,
  SmartRecruitersPosting,
} from './smartrecruiters.types.js';

/**
 * Ad sections concatenated into the description, in reading order.
 */
const DESCRIPTION_SECTIONS = [
  'companyDescription',
  'jobDescription',
  'qualifications',
  'additionalInformation',
] as const;

/**
 * SmartRecruiters postings API, one extra call per offer for the description.
 */
export async function fetchSmartRecruiters(
  company: CompanyConfig,
): Promise<RawJob[]> {
  const body = await getJson<{ content?: SmartRecruitersPosting[] }>(
    `https://api.smartrecruiters.com/v1/companies/${company.board}/postings?limit=100`,
    TIMEOUT_MS,
  );

  const french = (body.content ?? []).filter((posting) =>
    isFrance(posting.location?.country),
  );

  return Promise.all(
    french.map(async (posting) => {
      /* The listing has no description, so it needs one extra call per offer. */
      const description = await fetchDescription(company.board, posting.id);
      return {
        ...companyFields(company, 'SmartRecruiters'),
        sourceId: `smartrecruiters:${company.board}:${posting.id}`,
        title: posting.name,
        company: company.name,
        companyDescription: null,
        description,
        hasFullDescription: Boolean(description),
        contractLabel: posting.typeOfEmployment?.label ?? null,
        isPermanent: posting.typeOfEmployment?.id === 'permanent' ? true : null,
        salary: null,
        locationText: posting.location?.city ?? null,
        city: posting.location?.city ?? null,
        postalCode: posting.location?.postalCode ?? null,
        latitude: null,
        longitude: null,
        isRemote: posting.location?.remote === true,
        isLocationApproximate: false,
        url: `https://jobs.smartrecruiters.com/${company.board}/${posting.id}`,
        publishedAt: posting.releasedDate
          ? new Date(posting.releasedDate)
          : null,
      } satisfies RawJob;
    }),
  );
}

/**
 * Concatenates the ad sections into plain text.
 */
async function fetchDescription(
  board: string,
  postingId: string,
): Promise<string | null> {
  try {
    const detail = await getJson<SmartRecruitersDetail>(
      `https://api.smartrecruiters.com/v1/companies/${board}/postings/${postingId}`,
      TIMEOUT_MS,
    );
    const sections = detail.jobAd?.sections ?? {};
    const text = DESCRIPTION_SECTIONS.map((key) =>
      htmlToText(sections[key]?.text),
    )
      .filter(Boolean)
      .join('\n\n');
    return text || null;
  } catch {
    /* A missing description only costs the in-app detail view, not the offer. */
    return null;
  }
}
