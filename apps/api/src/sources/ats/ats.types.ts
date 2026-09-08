/**
 * The four ATS whose public job APIs are supported.
 */
export type AtsProvider = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';

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
   * Board identifier in the ATS URL.
   */
  board: string;
}
