import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { fetchAshby } from './ashby.js';
import { fetchCapgemini } from './capgemini.js';
import { fetchGreenhouse } from './greenhouse.js';
import { fetchLever } from './lever.js';
import { fetchSmartRecruiters } from './smartrecruiters.js';

/**
 * Address a fetch was called with.
 */
function href(input: Parameters<typeof fetch>[0]): string {
  return input instanceof Request ? input.url : input.toString();
}

/**
 * Company polled by every provider spec, its board set per case.
 */
function company(provider: CompanyConfig['provider'], board = 'acme'): CompanyConfig {
  return { name: 'Acme', provider, board };
}

/**
 * JSON answer of a provider API.
 */
function json(body: unknown): Response {
  return new Response(JSON.stringify(body));
}

/**
 * Specs of the ATS providers: France filtering and mapping.
 */
describe('ATS providers', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Greenhouse board API.
   */
  describe('fetchGreenhouse', () => {
    it('keeps French offers, trusting the declared country over the office list', async () => {
      fetchMock.mockResolvedValue(
        json({
          jobs: [
            {
              id: 1,
              title: 'Développeur Java',
              absolute_url: 'https://acme.test/1',
              content: '&lt;p&gt;Stack Java&lt;/p&gt;',
              location: { name: 'Paris, France' },
              first_published: '2026-10-01T10:00:00Z',
              metadata: [{ name: 'Employment Type', value: 'Full-time' }],
            },
            {
              id: 2,
              title: 'Developer',
              absolute_url: 'https://acme.test/2',
              location: { name: 'Paris or London' },
              metadata: [{ name: 'Country', value: 'United Kingdom' }],
            },
            {
              id: 3,
              title: 'Developer',
              absolute_url: 'https://acme.test/3',
              location: { name: 'Madrid, Spain' },
            },
            {
              id: 4,
              title: 'Développeur remote',
              absolute_url: 'https://acme.test/4',
              content: '<p></p>',
              location: { name: 'Remote' },
              updated_at: '2026-10-02T10:00:00Z',
              metadata: [{ name: 'Country', value: 'France' }],
            },
          ],
        }),
      );

      const jobs = await fetchGreenhouse(company('greenhouse'));

      expect(href(fetchMock.mock.calls[0][0])).toBe(
        'https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true',
      );
      expect(jobs.map((job) => job.sourceId)).toEqual(['greenhouse:acme:1', 'greenhouse:acme:4']);
      expect(jobs[0]).toMatchObject({
        source: 'ATS',
        sourceLabel: 'Acme (Greenhouse)',
        description: 'Stack Java',
        hasFullDescription: true,
        contractLabel: 'Full-time',
        isPermanent: true,
        publishedAt: new Date('2026-10-01T10:00:00Z'),
      });
      expect(jobs[1]).toMatchObject({
        description: null,
        hasFullDescription: false,
        isRemote: true,
        publishedAt: new Date('2026-10-02T10:00:00Z'),
      });
    });
  });

  /**
   * Lever postings API.
   */
  describe('fetchLever', () => {
    it('keeps French postings and joins the plain texts', async () => {
      fetchMock.mockResolvedValue(
        json([
          {
            id: 'a',
            text: 'Développeur',
            country: 'FR',
            hostedUrl: 'https://jobs.lever.co/acme/a',
            descriptionPlain: 'Stack Angular',
            additionalPlain: 'Mutuelle',
            workplaceType: 'remote',
            createdAt: Date.UTC(2026, 9, 1),
            categories: { location: 'Paris', commitment: 'CDI' },
          },
          {
            id: 'b',
            text: 'Développeur',
            hostedUrl: 'https://jobs.lever.co/acme/b',
            categories: { location: 'Rouen, France' },
          },
          { id: 'c', text: 'Developer', country: 'DE', hostedUrl: 'https://jobs.lever.co/acme/c' },
        ]),
      );

      const jobs = await fetchLever(company('lever'));

      expect(jobs.map((job) => job.sourceId)).toEqual(['lever:acme:a', 'lever:acme:b']);
      expect(jobs[0]).toMatchObject({
        description: 'Stack Angular\n\nMutuelle',
        hasFullDescription: true,
        isPermanent: true,
        isRemote: true,
        city: 'Paris',
        publishedAt: new Date('2026-10-01T00:00:00Z'),
      });
      expect(jobs[1]).toMatchObject({ description: null, isPermanent: null, publishedAt: null });
    });
  });

  /**
   * Ashby job-board API.
   */
  describe('fetchAshby', () => {
    it('keeps French offers and reads the structured address', async () => {
      fetchMock.mockResolvedValue(
        json({
          jobs: [
            {
              id: 'a',
              title: 'Développeur',
              jobUrl: 'https://jobs.ashbyhq.com/acme/a',
              location: 'Caen',
              descriptionPlain: 'Stack Java',
              employmentType: 'FullTime',
              address: {
                postalAddress: {
                  addressCountry: 'France',
                  addressLocality: 'Caen',
                  postalCode: '14000',
                },
              },
            },
            {
              id: 'b',
              title: 'Developer',
              jobUrl: 'https://jobs.ashbyhq.com/acme/b',
              location: 'Berlin',
            },
            {
              id: 'c',
              title: 'Développeur',
              jobUrl: 'https://jobs.ashbyhq.com/acme/c',
              location: 'France',
              workplaceType: 'Remote',
              publishedAt: 'not a date',
            },
          ],
        }),
      );

      const jobs = await fetchAshby(company('ashby'));

      expect(jobs.map((job) => job.sourceId)).toEqual(['ashby:acme:a', 'ashby:acme:c']);
      expect(jobs[0]).toMatchObject({
        city: 'Caen',
        postalCode: '14000',
        hasFullDescription: true,
        isRemote: false,
      });
      expect(jobs[1]).toMatchObject({ city: 'France', isRemote: true, publishedAt: null });
    });
  });

  /**
   * Capgemini search API.
   */
  describe('fetchCapgemini', () => {
    it('keeps the offers listing the board town and pins them to it', async () => {
      fetchMock.mockResolvedValue(
        json({
          data: [
            {
              id: '1',
              title: 'Développeur Java',
              brand: 'Capgemini Engineering',
              contract_type: 'CDI',
              description: '<p>Stack Java</p>',
              location: 'Rouen, Caen, Paris',
              apply_job_url: 'https://capgemini.test/1',
            },
            {
              id: '2',
              title: 'Développeur',
              location: 'Paris',
              apply_job_url: 'https://capgemini.test/2',
            },
          ],
        }),
      );

      const jobs = await fetchCapgemini(company('capgemini', 'Rouen'));

      const url = new URL(href(fetchMock.mock.calls[0][0]));
      expect(url.searchParams.get('search')).toBe('Rouen');
      expect(url.searchParams.get('size')).toBe('100');
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        sourceId: 'capgemini:Rouen:1',
        company: 'Capgemini Engineering',
        city: 'Rouen',
        description: 'Stack Java',
        isPermanent: true,
      });
    });
  });

  /**
   * SmartRecruiters postings API, one detail call per offer.
   */
  describe('fetchSmartRecruiters', () => {
    it('keeps French postings and builds the description from the ad sections', async () => {
      fetchMock.mockImplementation(async (url) => {
        const path = new URL(href(url)).pathname;
        if (path.endsWith('/postings')) {
          return json({
            content: [
              {
                id: 'p1',
                name: 'Développeur',
                releasedDate: '2026-10-01T00:00:00Z',
                location: { city: 'Le Havre', country: 'fr', postalCode: '76600' },
                typeOfEmployment: { id: 'permanent', label: 'CDI' },
              },
              { id: 'p2', name: 'Developer', location: { city: 'Lyon', country: 'fr' } },
              { id: 'p3', name: 'Developer', location: { city: 'Turin', country: 'it' } },
            ],
          });
        }
        if (path.endsWith('/p1')) {
          return json({
            jobAd: {
              sections: {
                companyDescription: { text: '<p>Acme</p>' },
                jobDescription: { text: '<p>Stack Java</p>' },
              },
            },
          });
        }
        return new Response('', { status: 500 });
      });

      const jobs = await fetchSmartRecruiters({ ...company('smartrecruiters'), filter: 'q=dev' });

      expect(href(fetchMock.mock.calls[0][0])).toBe(
        'https://api.smartrecruiters.com/v1/companies/acme/postings?limit=100&q=dev',
      );
      expect(jobs.map((job) => job.sourceId)).toEqual([
        'smartrecruiters:acme:p1',
        'smartrecruiters:acme:p2',
      ]);
      expect(jobs[0]).toMatchObject({
        description: 'Acme\n\nStack Java',
        hasFullDescription: true,
        isPermanent: true,
        city: 'Le Havre',
        url: 'https://jobs.smartrecruiters.com/acme/p1',
      });
      expect(jobs[1]).toMatchObject({ description: null, isPermanent: null });
    });
  });
});
