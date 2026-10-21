import { unusualContract } from './job-row.utils';

describe('job row utils', () => {
  it('keeps only a contract wording other than the usual one', () => {
    expect(unusualContract('CDI')).toBeNull();
    expect(unusualContract('cdi')).toBeNull();
    expect(unusualContract(null)).toBeNull();
    expect(unusualContract('Full-time')).toBe('Full-time');
  });
});
