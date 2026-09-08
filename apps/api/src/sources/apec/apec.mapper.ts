import { toNumber } from '../../common/to-number.js';
import type { RawJob } from '../raw-job.js';
import { DETAIL_URL } from './apec.constants.js';
import type { ApecOffer } from './apec.types.js';
import { cityFromLieuTexte } from './city-from-lieu-texte.js';

/**
 * APEC offer to the source-agnostic shape; `isRemote` comes from the remote facet.
 */
export function toRawJob(offer: ApecOffer, isRemote: boolean): RawJob {
  const located = offer.localisable === true;

  return {
    source: 'APEC',
    sourceId: offer.numeroOffre,
    sourceLabel: 'APEC',
    title: offer.intitule,
    company: offer.nomCommercial ?? null,
    companyDescription: null,
    description: offer.texteOffre ?? null,
    /* The search only returns a teaser and the detail endpoint rejects us. */
    hasFullDescription: false,
    contractLabel: 'CDI',
    /* The search is filtered on the CDI referential id. */
    isPermanent: true,
    salary: offer.salaireTexte ?? null,
    locationText: offer.lieuTexte ?? null,
    city: cityFromLieuTexte(offer.lieuTexte),
    /* The trailing number is a department, not a postal code. */
    postalCode: null,
    latitude: located ? toNumber(offer.latitude) : null,
    longitude: located ? toNumber(offer.longitude) : null,
    isRemote,
    isLocationApproximate: false,
    url: `${DETAIL_URL}/${offer.numeroOffre}`,
    publishedAt: offer.datePublication
      ? new Date(offer.datePublication)
      : null,
  };
}
