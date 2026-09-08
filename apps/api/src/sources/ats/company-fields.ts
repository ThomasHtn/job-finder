import type { RawJob } from '../raw-job.js';
import type { CompanyConfig } from './ats.types.js';

/**
 * Fields shared by every offer of one company.
 */
export function companyFields(
  company: CompanyConfig,
  provider: string,
): Pick<RawJob, 'source' | 'sourceLabel'> {
  return { source: 'ATS', sourceLabel: `${company.name} (${provider})` };
}
