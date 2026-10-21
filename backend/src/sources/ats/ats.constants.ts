/**
 * Time given to one ATS request.
 */
export const TIMEOUT_MS = 20_000;

/**
 * Offers asked per request where a board caps its listing (Capgemini, SmartRecruiters).
 */
export const ATS_PAGE_SIZE = 100;

/**
 * Talentsoft locale id of French, the language the feeds are read in.
 */
export const TALENTSOFT_FRENCH_LCID = 1036;

/**
 * Country names that mark a position as abroad.
 */
export const FOREIGN_COUNTRIES =
  /\b(germany|deutschland|italy|italia|spain|espa[ñn]a|netherlands|belgium|belgique|portugal|united kingdom|england|ireland|poland|serbia|romania|sweden|denmark|switzerland|suisse|austria|united states|usa|canada|india|brazil|morocco|tunisia)\b/i;
