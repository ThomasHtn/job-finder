/**
 * OAuth2 token payload.
 */
export interface TokenResponse {
  /**
   * Bearer token to send on every search.
   */
  access_token: string;

  /**
   * Lifetime of the token, in seconds.
   */
  expires_in: number;
}

/**
 * The fields read from one France Travail offer.
 */
export interface FranceTravailOffer {
  /**
   * Offer id, used as sourceId and in the fallback detail URL.
   */
  id: string;

  /**
   * Ad title, shown as is.
   */
  intitule: string;

  /**
   * Full ad as plain text, the search needs no detail call.
   */
  description?: string;

  /**
   * Creation date, ISO 8601.
   */
  dateCreation?: string;

  /**
   * Contract code, e.g. "CDI" or "CDD"; only "CDI" counts as permanent.
   */
  typeContrat?: string;

  /**
   * Readable contract label, preferred over the code in the UI.
   */
  typeContratLibelle?: string;

  /**
   * Workplace; `commune` is an INSEE code, the town name only lives in `libelle`.
   */
  lieuTravail?: {
    libelle?: string;
    latitude?: number;
    longitude?: number;
    codePostal?: string;
    commune?: string;
  };

  /**
   * Employer name and presentation, both optional.
   */
  entreprise?: { nom?: string; description?: string };

  /**
   * Salary as free text, shown as is.
   */
  salaire?: { libelle?: string };

  /**
   * Original ad link, and the partner boards that relay the offer.
   */
  origineOffre?: {
    urlOrigine?: string;
    partenaires?: { nom?: string; url?: string }[];
  };

  /**
   * Working conditions, where an explicit full-remote mention can appear.
   */
  contexteTravail?: { conditionsExercice?: string[] };
}

/**
 * One page of a France Travail search; a 204 carries no body at all.
 */
export interface FranceTravailSearchResponse {
  /**
   * Offers of the page.
   */
  resultats?: FranceTravailOffer[];
}

/**
 * Bearer token kept between calls, with the moment it must be renewed.
 */
export interface CachedToken {
  /**
   * The bearer token itself.
   */
  value: string;

  /**
   * Epoch milliseconds after which a new token is requested.
   */
  expiresAt: number;
}
