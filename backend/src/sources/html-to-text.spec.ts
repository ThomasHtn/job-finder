import { describe, expect, it } from 'vitest';

import { htmlToText } from './html-to-text.js';

/**
 * Plain text of the descriptions the boards send as HTML.
 */
describe('htmlToText', () => {
  it('turns block tags into lines and list items into dashes', () => {
    expect(htmlToText('<p>Missions</p><ul><li>Angular</li><li>Java</li></ul>')).toBe(
      'Missions\n- Angular\n- Java',
    );
  });

  it('decodes named, decimal and hexadecimal entities', () => {
    expect(htmlToText('<p>R&amp;D &eacute;quipe &#233;t&#xE9;</p>')).toBe('R&D équipe été');
  });

  it('unescapes entity-escaped HTML once before removing its tags', () => {
    expect(htmlToText('&lt;p&gt;Caf&amp;eacute; &amp;amp; th&amp;eacute;&lt;/p&gt;')).toBe(
      'Café & thé',
    );
  });

  it('keeps an escaped angle bracket as text instead of reading it as a tag', () => {
    expect(htmlToText('<p>Expérience &lt; 3 ans</p><p>Suite &gt; tout</p>')).toBe(
      'Expérience < 3 ans\nSuite > tout',
    );
    expect(htmlToText('&lt;p&gt;Expérience &amp;lt; 3 ans&lt;/p&gt;&lt;p&gt;Suite&lt;/p&gt;')).toBe(
      'Expérience < 3 ans\nSuite',
    );
  });

  it('leaves malformed or out-of-range numeric entities as they are', () => {
    expect(htmlToText('a &#abc; b &#99999999; c')).toBe('a &#abc; b &#99999999; c');
  });

  it('drops the NUL character a numeric entity decodes to', () => {
    expect(htmlToText('<p>Java&#0; &#x0;Spring</p>')).toBe('Java Spring');
    expect(htmlToText('&#0;')).toBeNull();
  });

  it('collapses spaces, including non-breaking ones, and blank lines', () => {
    expect(htmlToText('<p>a&nbsp;  b</p><br><br><br><p>c</p>')).toBe('a b\n\nc');
  });

  it('answers null for an empty or tag-only description', () => {
    expect(htmlToText(null)).toBeNull();
    expect(htmlToText('')).toBeNull();
    expect(htmlToText('<p> </p>')).toBeNull();
  });
});
