import { permanentFromLabel } from '../../ingestion/classifier.js';
import { htmlToText } from '../html-to-text.js';
import type { RawJob } from '../source.types.js';
import type { AtsProvider, CompanyConfig } from './companies.config.js';

const TIMEOUT_MS = 20_000;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

/** ATS boards are international; only French positions are worth ingesting. */
function isFrance(...candidates: (string | null | undefined)[]): boolean {
  return candidates.some(
    (value) => value && /\bfrance\b|^fr$/i.test(value.trim()),
  );
}

const FOREIGN_COUNTRIES =
  /\b(germany|deutschland|italy|italia|spain|espa[ñn]a|netherlands|belgium|belgique|portugal|united kingdom|england|ireland|poland|serbia|romania|sweden|denmark|switzerland|suisse|austria|united states|usa|canada|india|brazil|morocco|tunisia)\b/i;

/** Guards against boards whose country metadata contradicts the office location. */
function mentionsForeignCountry(location: string | null | undefined): boolean {
  return Boolean(
    location && FOREIGN_COUNTRIES.test(location) && !isFrance(location),
  );
}

function base(
  company: CompanyConfig,
  provider: string,
): Pick<RawJob, 'source' | 'sourceLabel'> {
  return { source: 'ATS', sourceLabel: `${company.name} (${provider})` };
}

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  content?: string;
  location?: { name?: string };
  metadata?: { name: string; value: string | null }[];
}

async function fetchGreenhouse(company: CompanyConfig): Promise<RawJob[]> {
  const body = await getJson<{ jobs?: GreenhouseJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${company.board}/jobs?content=true`,
  );

  return (body.jobs ?? [])
    .filter((job) => {
      if (mentionsForeignCountry(job.location?.name)) return false;
      // When the board declares a country, trust it: the location string often
      // lists several offices, including foreign ones.
      const country = job.metadata?.find((m) => /country/i.test(m.name))?.value;
      return country ? isFrance(country) : isFrance(job.location?.name);
    })
    .map((job) => {
      const employmentType = job.metadata?.find((m) =>
        /employment type/i.test(m.name),
      )?.value;
      return {
        ...base(company, 'Greenhouse'),
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

interface LeverJob {
  id: string;
  text: string;
  country?: string;
  workplaceType?: string;
  createdAt?: number;
  hostedUrl: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  categories?: { location?: string; commitment?: string };
}

async function fetchLever(company: CompanyConfig): Promise<RawJob[]> {
  const jobs = await getJson<LeverJob[]>(
    `https://api.lever.co/v0/postings/${company.board}?mode=json`,
  );

  return jobs
    .filter((job) => job.country === 'FR' || isFrance(job.categories?.location))
    .map((job) => ({
      ...base(company, 'Lever'),
      sourceId: `lever:${company.board}:${job.id}`,
      title: job.text,
      company: company.name,
      companyDescription: null,
      description:
        [job.descriptionPlain, job.additionalPlain]
          .filter(Boolean)
          .join('\n\n') || null,
      hasFullDescription: Boolean(job.descriptionPlain),
      contractLabel: job.categories?.commitment ?? null,
      isPermanent: permanentFromLabel(job.categories?.commitment),
      salary: null,
      locationText: job.categories?.location ?? null,
      city: job.categories?.location ?? null,
      postalCode: null,
      latitude: null,
      longitude: null,
      isRemote: job.workplaceType === 'remote',
      isLocationApproximate: false,
      url: job.hostedUrl,
      publishedAt: job.createdAt ? new Date(job.createdAt) : null,
    }));
}

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  publishedAt?: string;
  jobUrl: string;
  descriptionPlain?: string;
  employmentType?: string;
  isRemote?: boolean | null;
  workplaceType?: string | null;
  address?: {
    postalAddress?: {
      addressCountry?: string;
      addressLocality?: string;
      postalCode?: string;
    };
  };
}

async function fetchAshby(company: CompanyConfig): Promise<RawJob[]> {
  const body = await getJson<{ jobs?: AshbyJob[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${company.board}`,
  );

  return (body.jobs ?? [])
    .filter((job) =>
      isFrance(job.address?.postalAddress?.addressCountry, job.location),
    )
    .map((job) => {
      const address = job.address?.postalAddress;
      return {
        ...base(company, 'Ashby'),
        sourceId: `ashby:${company.board}:${job.id}`,
        title: job.title,
        company: company.name,
        companyDescription: null,
        description: job.descriptionPlain ?? null,
        hasFullDescription: Boolean(job.descriptionPlain),
        contractLabel: job.employmentType ?? null,
        isPermanent: permanentFromLabel(job.employmentType),
        salary: null,
        locationText: job.location ?? null,
        city: address?.addressLocality ?? job.location ?? null,
        postalCode: address?.postalCode ?? null,
        latitude: null,
        longitude: null,
        isRemote: job.isRemote === true || job.workplaceType === 'Remote',
        isLocationApproximate: false,
        url: job.jobUrl,
        publishedAt: job.publishedAt ? new Date(job.publishedAt) : null,
      };
    });
}

interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate?: string;
  location?: {
    city?: string;
    country?: string;
    postalCode?: string;
    remote?: boolean;
  };
  typeOfEmployment?: { id?: string; label?: string };
}

interface SmartRecruitersDetail {
  jobAd?: { sections?: Record<string, { text?: string }> };
}

async function fetchSmartRecruiters(company: CompanyConfig): Promise<RawJob[]> {
  const body = await getJson<{ content?: SmartRecruitersPosting[] }>(
    `https://api.smartrecruiters.com/v1/companies/${company.board}/postings?limit=100`,
  );

  const french = (body.content ?? []).filter((posting) =>
    isFrance(posting.location?.country),
  );

  return Promise.all(
    french.map(async (posting) => {
      // The listing has no description, so it needs one extra call per offer.
      const description = await fetchSmartRecruitersDescription(
        company.board,
        posting.id,
      );
      return {
        ...base(company, 'SmartRecruiters'),
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

async function fetchSmartRecruitersDescription(
  board: string,
  postingId: string,
): Promise<string | null> {
  try {
    const detail = await getJson<SmartRecruitersDetail>(
      `https://api.smartrecruiters.com/v1/companies/${board}/postings/${postingId}`,
    );
    const sections = detail.jobAd?.sections ?? {};
    const text = [
      'companyDescription',
      'jobDescription',
      'qualifications',
      'additionalInformation',
    ]
      .map((key) => htmlToText(sections[key]?.text))
      .filter(Boolean)
      .join('\n\n');
    return text || null;
  } catch {
    // A missing description only costs the in-app detail view, not the offer.
    return null;
  }
}

export const ATS_FETCHERS: Record<
  AtsProvider,
  (company: CompanyConfig) => Promise<RawJob[]>
> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
};
