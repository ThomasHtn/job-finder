/**
 * The fields read from one APEC offer.
 */
export interface ApecOffer {
  /**
   * Offer number, used as sourceId and in the public ad URL.
   */
  numeroOffre: string;
  /**
   * Ad title, shown as is.
   */
  intitule: string;
  /**
   * Employer's trade name, when the offer discloses it.
   */
  nomCommercial?: string;
  /**
   * "Caen - 14": town then department number.
   */
  lieuTexte?: string;
  /**
   * Salary as free text, shown as is.
   */
  salaireTexte?: string;
  /**
   * Teaser, always truncated: the detail endpoint is not public.
   */
  texteOffre?: string;
  /**
   * Publication date, ISO 8601.
   */
  datePublication?: string;
  /**
   * Decimal degrees, as strings, and only meaningful when `localisable`.
   */
  latitude?: string;
  /**
   * Same format and caveat as `latitude`.
   */
  longitude?: string;
  /**
   * False when APEC could not place the offer: its coordinates are then ignored.
   */
  localisable?: boolean;
}

/**
 * One page of an APEC search.
 */
export interface ApecSearchResponse {
  /**
   * Offers of the page; missing when the search matched nothing.
   */
  resultats?: ApecOffer[];
}
