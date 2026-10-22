import { describe, expect, it } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './capgemini.mapper.js';

/**
 * Company mapped by the specs below: its board is the office town.
 */
const COMPANY: CompanyConfig = { name: 'Capgemini', provider: 'capgemini', board: 'Rouen' };

/**
 * Specs of the Capgemini result mapping.
 */
describe('Capgemini toRawJob', () => {
  it('pins the offer to the board town and uses the hiring entity as company', () => {
    const job = toRawJob(COMPANY, {
      id: '1',
      title: 'Développeur Java',
      brand: 'Capgemini Engineering',
      contract_type: 'CDI',
      description: '<p>Stack Java</p>',
      location: 'Rouen, Caen, Paris',
      apply_job_url: 'https://capgemini.test/1',
    });

    expect(job).toMatchObject({
      sourceId: 'capgemini:Rouen:1',
      company: 'Capgemini Engineering',
      city: 'Rouen',
      description: 'Stack Java',
      isPermanent: true,
    });
  });

  it('falls back to the company name', () => {
    const job = toRawJob(COMPANY, {
      id: '2',
      title: 'Développeur',
      apply_job_url: 'https://capgemini.test/2',
    });

    expect(job).toMatchObject({ company: 'Capgemini', description: null, isPermanent: null });
  });
});
