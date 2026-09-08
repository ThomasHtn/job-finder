import type { RawJob } from '../raw-job.js';
import { cityFromLabel } from './city-from-label.js';
import { DETAIL_URL, FULL_REMOTE_TEXT } from './france-travail.constants.js';
import type { FranceTravailOffer } from './france-travail.types.js';

/**
 * France Travail offer to the source-agnostic shape.
 */
export function toRawJob(offer: FranceTravailOffer): RawJob {
  const conditions = offer.contexteTravail?.conditionsExercice ?? [];
  const place = offer.lieuTravail;

  return {
    source: 'FRANCE_TRAVAIL',
    sourceId: offer.id,
    sourceLabel: 'France Travail',
    title: offer.intitule,
    company: offer.entreprise?.nom ?? null,
    companyDescription: offer.entreprise?.description ?? null,
    description: offer.description ?? null,
    /* The search endpoint already returns the full text, no detail call needed. */
    hasFullDescription: Boolean(offer.description),
    contractLabel: offer.typeContratLibelle ?? offer.typeContrat ?? null,
    isPermanent: offer.typeContrat === 'CDI',
    salary: offer.salaire?.libelle ?? null,
    locationText: place?.libelle ?? null,
    /* `commune` is an INSEE code, unusable in the UI: the label carries the name. */
    city: cityFromLabel(place?.libelle),
    postalCode: place?.codePostal ?? null,
    latitude: place?.latitude ?? null,
    longitude: place?.longitude ?? null,
    /*
     * The API mostly says "Possibilité de télétravail", which is partial: only an
     * explicit full-remote wording counts, the text heuristic handles the rest.
     */
    isRemote: conditions.some((condition) => FULL_REMOTE_TEXT.test(condition)),
    isLocationApproximate: false,
    url: offer.origineOffre?.urlOrigine ?? `${DETAIL_URL}/${offer.id}`,
    publishedAt: offer.dateCreation ? new Date(offer.dateCreation) : null,
  };
}
