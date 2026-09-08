/**
 * The fields read from one APEC offer.
 */
export interface ApecOffer {
  numeroOffre: string;
  intitule: string;
  nomCommercial?: string;
  /**
   * "Caen - 14": town then department number.
   */
  lieuTexte?: string;
  salaireTexte?: string;
  /**
   * Teaser, always truncated: the detail endpoint is not public.
   */
  texteOffre?: string;
  datePublication?: string;
  /**
   * Decimal degrees, as strings, and only meaningful when `localisable`.
   */
  latitude?: string;
  longitude?: string;
  localisable?: boolean;
}
