import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rawJob } from '../raw-job.fixtures.js';
import { AtsSource } from './ats.source.js';
import { ATS_FETCHERS } from './providers/ats-fetchers.js';

vi.mock('./companies.constants.js', () => ({
  COMPANIES: [
    { name: 'Acme', provider: 'greenhouse', board: 'acme' },
    { name: 'Globex', provider: 'lever', board: 'globex' },
  ],
}));

vi.mock('./providers/ats-fetchers.js', () => ({
  ATS_FETCHERS: { greenhouse: vi.fn(), lever: vi.fn() },
}));

/**
 * Specs of the company career sites connector.
 */
describe('AtsSource', () => {
  const greenhouse = vi.mocked(ATS_FETCHERS.greenhouse);
  const lever = vi.mocked(ATS_FETCHERS.lever);

  beforeEach(() => {
    greenhouse.mockReset();
    lever.mockReset();
  });

  it('is enabled while the company list is not empty', () => {
    expect(new AtsSource().isEnabled()).toBe(true);
  });

  it('gathers the offers of every company through its provider', async () => {
    greenhouse.mockResolvedValue([rawJob({ sourceId: 'gh' })]);
    lever.mockResolvedValue([rawJob({ sourceId: 'lv' })]);

    const jobs = await new AtsSource().fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['gh', 'lv']);
    expect(greenhouse).toHaveBeenCalledWith(expect.objectContaining({ board: 'acme' }));
  });

  it('keeps the other companies when one fails', async () => {
    greenhouse.mockRejectedValue(new Error('acme returned 404'));
    lever.mockResolvedValue([rawJob({ sourceId: 'lv' })]);

    const jobs = await new AtsSource().fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['lv']);
  });

  it('fails when every company fails', async () => {
    greenhouse.mockRejectedValue(new Error('acme returned 404'));
    lever.mockRejectedValue(new Error('globex returned 500'));

    await expect(new AtsSource().fetchJobs()).rejects.toThrow(
      'Every company failed, first: Error: acme returned 404',
    );
  });
});
