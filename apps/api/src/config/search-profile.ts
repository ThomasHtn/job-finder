/**
 * Everything that makes the search specific to one person: the trade and the
 * commuting area. Built once from the environment, injected where needed.
 */
export interface SearchArea {
  /** Name of the on-site tab in the UI, e.g. "Seine-Maritime". */
  label: string;
  /** Origin of the commuting area, used by the isochrone and the radius fallback. */
  center: { latitude: number; longitude: number };
  /** Driving time the isochrone was generated for. */
  driveMinutes: number;
  /** City name understood by sources that search by place (Adzuna). */
  city: string;
  /** INSEE code of that city, required by France Travail. */
  insee: string;
  /** NUTS-2 region code, the only granularity EURES offers. */
  euresRegion: string;
}

export interface SearchProfile {
  /** Free-text queries sent to every source, one concept per entry. */
  keywords: string[];
  /** ROME code for France Travail, catches offers whose wording differs. */
  romeCode: string | null;
  /** The title must contain one of these (accent-insensitive). */
  titleInclude: string[];
  /** The title must not contain any of these. */
  titleExclude: string[];
  /** The ad must mention one of these technologies, or it is dropped. */
  stackKeywords: string[];
  area: SearchArea;
}

export const SEARCH_PROFILE = Symbol('SEARCH_PROFILE');
