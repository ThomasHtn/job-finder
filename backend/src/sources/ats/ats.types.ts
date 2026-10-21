/**
 * The ATS (and single-company career APIs) whose public job feeds are supported.
 */
export type AtsProvider =
  'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'talentsoft' | 'capgemini';

/**
 * One company career site to poll.
 */
export interface CompanyConfig {
  /**
   * Display name, used in the source label shown in the UI.
   */
  name: string;

  /**
   * Which ATS the company uses.
   */
  provider: AtsProvider;

  /**
   * Board identifier in the ATS URL: a slug, a host (Talentsoft) or a search term (Capgemini).
   */
  board: string;

  /**
   * Extra query string narrowing a large board to the area, e.g. `region=Normandy`.
   */
  filter?: string;
}
