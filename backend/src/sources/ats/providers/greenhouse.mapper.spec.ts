import { describe, expect, it } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './greenhouse.mapper.js';

/**
 * Company mapped by the specs below.
 */
const COMPANY: CompanyConfig = { name: 'Acme', provider: 'greenhouse', board: 'acme' };

/**
 * Specs of the Greenhouse posting mapping.
 */
describe('Greenhouse toRawJob', () => {
  it('unescapes the content and reads the employment type', () => {
    const job = toRawJob(COMPANY, {
      id: 1,
      title: 'Développeur Java',
      absolute_url: 'https://acme.test/1',
      content: '&lt;p&gt;Stack Java&lt;/p&gt;',
      location: { name: 'Paris, France' },
      first_published: '2026-10-01T10:00:00Z',
      metadata: [{ name: 'Employment Type', value: 'Full-time' }],
    });

    expect(job).toMatchObject({
      source: 'ATS',
      sourceId: 'greenhouse:acme:1',
      sourceLabel: 'Acme (Greenhouse)',
      description: 'Stack Java',
      hasFullDescription: true,
      contractLabel: 'Full-time',
      isPermanent: true,
      publishedAt: new Date('2026-10-01T10:00:00Z'),
    });
  });

  it('flags a remote location and falls back to the update date', () => {
    const job = toRawJob(COMPANY, {
      id: 4,
      title: 'Développeur remote',
      absolute_url: 'https://acme.test/4',
      content: '<p></p>',
      location: { name: 'Remote' },
      updated_at: '2026-10-02T10:00:00Z',
    });

    expect(job).toMatchObject({
      description: null,
      hasFullDescription: false,
      isRemote: true,
      publishedAt: new Date('2026-10-02T10:00:00Z'),
    });
  });
});
