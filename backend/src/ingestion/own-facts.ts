import type { PreparedJob } from './ingestion.types.js';

/**
 * The columns an offer always refreshes from its own board; the link, the text and the date are
 * decided by the merge plan.
 */
export function ownFacts(job: PreparedJob) {
  return {
    title: job.title,
    company: job.company,
    companyDescription: job.companyDescription,
    contractLabel: job.contractLabel,
    salary: job.salary,
    city: job.city,
    postalCode: job.postalCode,
    isRemote: job.isRemote,
    isLocationApproximate: job.isLocationApproximate,
    dedupeHash: job.dedupeHash,
  };
}
