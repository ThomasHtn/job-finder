/**
 * Time given to one ATS request: every board downloads at once, and the largest (Pigment, 2 MB)
 * sometimes needed more than 20 s while sharing the line with the others.
 */
export const TIMEOUT_MS = 30_000;

/**
 * Offers asked per request where a board caps its listing (Capgemini, SmartRecruiters).
 */
export const ATS_PAGE_SIZE = 100;

/**
 * First page of a paged board, as the query string spells it.
 */
export const FIRST_PAGE = '1';

/**
 * Country filter of Capgemini's search API: French offers only.
 */
export const CAPGEMINI_COUNTRY_CODE = 'fr-fr';

/**
 * Talentsoft locale id of French, the language the feeds are read in.
 */
export const TALENTSOFT_FRENCH_LCID = 1036;

/**
 * Country names that mark a position as abroad.
 */
export const FOREIGN_COUNTRIES =
  /\b(germany|deutschland|italy|italia|spain|espa[ñn]a|netherlands|belgium|belgique|portugal|united kingdom|england|ireland|poland|serbia|romania|sweden|denmark|switzerland|suisse|austria|united states|usa|canada|india|brazil|morocco|tunisia)\b/i;
