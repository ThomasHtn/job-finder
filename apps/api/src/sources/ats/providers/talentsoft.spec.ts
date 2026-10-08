import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTalentsoft } from './talentsoft.js';

/**
 * Trimmed copy of a real Matmut feed item (2026-10-08).
 */
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Export RSS</title>
<item>
  <link>https://recrutement.matmut.fr/Pages/Offre/detailoffre.aspx?idOffre=10639&amp;idOrigine=502&amp;LCID=1036</link>
  <category>SYSTEMES D'INFORMATION/Production</category>
  <category>DUREE INDETERMINEE</category>
  <category>66 rue de Sotteville </category>
  <title>2026-10639 - Ingénieur DevOps F/H</title>
  <description>&lt;b&gt;Contrat : &lt;/b&gt;DUREE INDETERMINEE&lt;br /&gt;Stack Java &amp;amp; Kubernetes</description>
  <pubDate>Wed, 30 Sep 2026 15:04:39 Z</pubDate>
</item>
</channel></rss>`;

/**
 * Specs of the Talentsoft RSS adapter.
 */
describe('fetchTalentsoft', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a feed item, title reference and address included', async () => {
    const fetchMock = vi.fn(async () => new Response(FEED, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const [job] = await fetchTalentsoft({
      name: 'Matmut',
      provider: 'talentsoft',
      board: 'recrutement.matmut.fr',
      filter: 'Rss_JobRegion=199',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://recrutement.matmut.fr/handlers/offerRss.ashx?LCID=1036&Rss_JobRegion=199',
      expect.anything(),
    );
    expect(job).toMatchObject({
      sourceId: 'talentsoft:recrutement.matmut.fr:10639',
      sourceLabel: 'Matmut (Talentsoft)',
      title: 'Ingénieur DevOps F/H',
      isPermanent: true,
      locationText: '66 rue de Sotteville',
      description: 'Contrat : DUREE INDETERMINEE\nStack Java & Kubernetes',
      publishedAt: new Date('2026-09-30T15:04:39Z'),
    });
  });
});
