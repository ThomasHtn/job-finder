import { XMLParser } from 'fast-xml-parser';

/**
 * Keeps every value a string and always yields lists for repeated tags.
 */
export const FEED_PARSER = new XMLParser({
  parseTagValue: false,
  isArray: (tagName) => tagName === 'item' || tagName === 'category',
});
