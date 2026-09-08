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
  id: string;
  intitule: string;
  description?: string;
  dateCreation?: string;
  typeContrat?: string;
  typeContratLibelle?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number;
    longitude?: number;
    codePostal?: string;
    commune?: string;
  };
  entreprise?: { nom?: string; description?: string };
  salaire?: { libelle?: string };
  origineOffre?: { urlOrigine?: string };
  contexteTravail?: { conditionsExercice?: string[] };
}
