/**
 * Public runtime settings the front needs before rendering anything.
 */
export interface AppConfig {
  /**
   * Name of the on-site tab, e.g. "Seine-Maritime".
   */
  areaLabel: string;

  /**
   * True when the API is protected by a password: the front shows the login screen.
   */
  authRequired: boolean;
}
