import { startOfDay, unusualContract } from './job-row.utils';

describe('job row utils', () => {
  it('drops the time of day', () => {
    expect(startOfDay(new Date('2026-09-04T15:30:00'))).toBe(
      new Date('2026-09-04T00:00:00').getTime(),
    );
  });

  it('keeps only a contract wording other than the usual one', () => {
    expect(unusualContract('CDI')).toBeNull();
    expect(unusualContract('cdi')).toBeNull();
    expect(unusualContract(null)).toBeNull();
    expect(unusualContract('Full-time')).toBe('Full-time');
  });
});
