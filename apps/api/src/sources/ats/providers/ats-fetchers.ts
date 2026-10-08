import type { RawJob } from '../../raw-job.js';
import type { AtsProvider, CompanyConfig } from '../ats.types.js';
import { fetchAshby } from './ashby.js';
import { fetchCapgemini } from './capgemini.js';
import { fetchGreenhouse } from './greenhouse.js';
import { fetchLever } from './lever.js';
import { fetchSmartRecruiters } from './smartrecruiters.js';
import { fetchTalentsoft } from './talentsoft.js';

/**
 * Fetcher per provider, looked up by the ATS connector.
 */
export const ATS_FETCHERS: Record<
  AtsProvider,
  (company: CompanyConfig) => Promise<RawJob[]>
> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  talentsoft: fetchTalentsoft,
  capgemini: fetchCapgemini,
};
