export type AtsProvider = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';

export interface CompanyConfig {
  /** Display name, used in the source label shown in the UI. */
  name: string;
  provider: AtsProvider;
  /** Board identifier in the ATS URL. */
  board: string;
}

/**
 * Companies whose career site is polled directly. One line per company.
 * Every entry below was verified to answer on its public endpoint.
 *
 * Le Havre industry (HAROPA, Sidel, Safran Nacelles, TotalEnergies, Renault
 * Sandouville, Siemens Energy, Sanofi, EDF, Segula, Ortec) is deliberately
 * absent: they run Workday or SuccessFactors, which expose no public job API.
 * Their offers are picked up through France Travail instead. No Normandy tech
 * employer (Yousign, Saagie, Matmut...) answers on these four ATS either, so the
 * list is mostly Paris scale-ups and remote-first companies, useful for the
 * remote tab. The consulting firms (SFEIR, Ippon) are the exception: they
 * staff CDI roles across several French cities, not just Paris.
 */
export const COMPANIES: CompanyConfig[] = [
  { name: 'Doctolib', provider: 'greenhouse', board: 'doctolib' },
  { name: 'Dataiku', provider: 'greenhouse', board: 'dataiku' },
  { name: 'Mirakl', provider: 'greenhouse', board: 'mirakl' },
  { name: 'Algolia', provider: 'greenhouse', board: 'algolia' },
  { name: 'Platform.sh', provider: 'greenhouse', board: 'platformsh' },
  { name: 'Datadog', provider: 'greenhouse', board: 'datadog' },
  { name: 'Klaxoon', provider: 'greenhouse', board: 'klaxoon' },
  { name: 'Silvr', provider: 'greenhouse', board: 'silvr' },
  { name: 'Dashlane', provider: 'greenhouse', board: 'dashlane' },
  { name: 'Ivalua', provider: 'greenhouse', board: 'ivalua' },
  { name: 'Qonto', provider: 'ashby', board: 'qonto' },
  { name: 'Pennylane', provider: 'ashby', board: 'pennylane' },
  { name: 'Alan', provider: 'ashby', board: 'alan' },
  { name: 'Back Market', provider: 'ashby', board: 'backmarket' },
  { name: 'Swan', provider: 'ashby', board: 'swan' },
  { name: 'Sorare', provider: 'ashby', board: 'sorare' },
  { name: 'Voodoo', provider: 'ashby', board: 'voodoo' },
  { name: 'Swile', provider: 'lever', board: 'swile' },
  { name: 'Malt', provider: 'lever', board: 'malt' },
  { name: 'Contentsquare', provider: 'lever', board: 'contentsquare' },
  { name: 'Aircall', provider: 'lever', board: 'aircall' },
  { name: 'BlaBlaCar', provider: 'lever', board: 'blablacar' },
  { name: 'Veepee', provider: 'lever', board: 'veepee' },
  { name: 'Younited', provider: 'lever', board: 'younited' },
  { name: 'Scaleway', provider: 'lever', board: 'scaleway' },
  { name: 'Ledger', provider: 'lever', board: 'ledger' },
  { name: 'Doctrine', provider: 'lever', board: 'doctrine' },
  { name: 'Agicap', provider: 'lever', board: 'agicap' },
  { name: 'Brevo', provider: 'lever', board: 'brevo' },
  {
    name: 'Vestiaire Collective',
    provider: 'lever',
    board: 'vestiairecollective',
  },
  { name: 'Theodo', provider: 'lever', board: 'theodo' },
  { name: 'Cheerz', provider: 'lever', board: 'cheerz' },
  { name: 'Shippeo', provider: 'smartrecruiters', board: 'shippeo' },
  { name: 'Dailymotion', provider: 'smartrecruiters', board: 'dailymotion' },
  // Remote-first or remote-friendly, checked on 2026-09-04.
  { name: 'lemlist', provider: 'ashby', board: 'lemlist' },
  { name: 'Kestra', provider: 'ashby', board: 'kestra' },
  { name: 'Photoroom', provider: 'ashby', board: 'photoroom' },
  { name: 'Nabla', provider: 'ashby', board: 'nabla' },
  { name: 'Owkin', provider: 'ashby', board: 'owkin' },
  { name: 'Dust', provider: 'ashby', board: 'dust' },
  { name: 'Gorgias', provider: 'ashby', board: 'gorgias' },
  { name: 'Pigment', provider: 'lever', board: 'pigment' },
  { name: '360Learning', provider: 'lever', board: '360learning' },
  // French consulting/ESN firms: many CDI dev roles across French cities (not remote-only,
  // not Paris-only), checked on 2026-09-06.
  { name: 'SFEIR', provider: 'lever', board: 'sfeir' },
  { name: 'Ippon Technologies', provider: 'lever', board: 'ippon' },
  { name: 'Comet', provider: 'greenhouse', board: 'comet' },
];
