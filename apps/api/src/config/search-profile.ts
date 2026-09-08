/**
 * Everything that makes the search specific to one person: the trade and the
 * commuting area. Built once from the environment, injected where needed.
 */
export interface SearchArea {
  /**
   * Name of the on-site tab in the UI, e.g. "Seine-Maritime".
   */
  label: string;

  /**
   * Origin of the commuting area, used by the isochrone and the radius fallback.
   */
  center: { latitude: number; longitude: number };

  /**
   * Road distance the isochrone was generated for, in kilometres.
   */
  driveKm: number;

  /**
   * City name understood by sources that search by place (Adzuna).
   */
  city: string;

  /**
   * INSEE code of that city, required by France Travail.
   */
  insee: string;

  /**
   * NUTS-2 region codes, the only granularity EURES offers.
   */
  euresRegions: string[];

  /**
   * APEC macro-region id, the coarsest place filter its search accepts.
   */
  apecLocation: string;

  /**
   * Free-Work location keys, "fr~<region>~<department>~<city>".
   */
  freeWorkLocations: string[];
}

/**
 * The trade being searched, plus where.
 */
export interface SearchProfile {
  /**
   * Free-text queries sent to every source, one concept per entry.
   */
  keywords: string[];

  /**
   * ROME code for France Travail, catches offers whose wording differs.
   */
  romeCode: string | null;

  /**
   * The title must contain one of these (accent-insensitive).
   */
  titleInclude: string[];

  /**
   * The title must not contain any of these.
   */
  titleExclude: string[];

  /**
   * The ad must mention one of these technologies, or it is dropped.
   */
  stackKeywords: string[];

  /**
   * Where on-site offers are accepted.
   */
  area: SearchArea;
}

/**
 * Injection token of the search profile.
 */
export const SEARCH_PROFILE = Symbol('SEARCH_PROFILE');
