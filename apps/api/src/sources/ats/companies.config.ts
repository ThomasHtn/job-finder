import type { CompanyConfig } from './ats.types.js';

/**
 * Companies whose career site is polled directly. One line per company.
 * Every entry below was verified to answer on its public endpoint.
 *
 * Le Havre industry (Renault, Sanofi, Thales, TotalEnergies, Sidel, Ortec,
 * Lubrizol...) does expose its career sites (Workday, Avature, SuccessFactors),
 * but none of their Normandy postings were software roles when checked on
 * 2026-10-08, so no adapter was written for them. Most entries are Paris
 * scale-ups and remote-first companies, useful for the remote tab; the
 * consulting firms staff CDI roles across several French cities. The Normandy
 * employers at the end are narrowed to the area with `filter`, since their
 * boards are too large (or capped) to be read whole.
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
  /* Remote-first or remote-friendly, checked on 2026-09-04. */
  { name: 'lemlist', provider: 'ashby', board: 'lemlist' },
  { name: 'Kestra', provider: 'ashby', board: 'kestra' },
  { name: 'Photoroom', provider: 'ashby', board: 'photoroom' },
  { name: 'Nabla', provider: 'ashby', board: 'nabla' },
  { name: 'Owkin', provider: 'ashby', board: 'owkin' },
  { name: 'Dust', provider: 'ashby', board: 'dust' },
  { name: 'Gorgias', provider: 'ashby', board: 'gorgias' },
  { name: 'Pigment', provider: 'lever', board: 'pigment' },
  { name: '360Learning', provider: 'lever', board: '360learning' },
  /*
   * French consulting/ESN firms: many CDI dev roles across French cities (not remote-only,
   * not Paris-only), checked on 2026-09-06.
   */
  { name: 'SFEIR', provider: 'lever', board: 'sfeir' },
  { name: 'Ippon Technologies', provider: 'lever', board: 'ippon' },
  { name: 'Comet', provider: 'greenhouse', board: 'comet' },
  /* Normandy employers with dev or IT CDI roles, checked on 2026-10-08. */
  {
    name: 'Sopra Steria',
    provider: 'smartrecruiters',
    board: 'SopraSteria1',
    filter: 'country=fr&region=Normandy',
  },
  {
    name: 'Matmut',
    provider: 'talentsoft',
    board: 'recrutement.matmut.fr',
    /* 199 = Normandie, 2499 = information systems job family. */
    filter: 'Rss_JobRegion=199&Rss_JobFamily=2499',
  },
  /* Rouen and Caen offices; the API only searches free text. */
  { name: 'Capgemini', provider: 'capgemini', board: 'Isneauville' },
  { name: 'Capgemini', provider: 'capgemini', board: 'Cormelles-le-Royal' },
];
