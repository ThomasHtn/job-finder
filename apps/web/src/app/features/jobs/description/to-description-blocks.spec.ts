import { toDescriptionBlocks } from './to-description-blocks';

function paragraph(text: string, lead = false) {
  return { items: [], text, lead };
}

function list(items: string[]) {
  return { items, text: '', lead: false };
}

/**
 * Plain text to paragraphs and lists.
 */
describe('toDescriptionBlocks', () => {
  it('returns nothing without a description', () => {
    expect(toDescriptionBlocks(null)).toEqual([]);
    expect(toDescriptionBlocks('')).toEqual([]);
  });

  it('re-flows lines the source hard-wrapped', () => {
    const blocks = toDescriptionBlocks('Rattaché au responsable\ndu pôle applicatif.');

    expect(blocks).toEqual([paragraph('Rattaché au responsable du pôle applicatif.')]);
  });

  it('splits on blank lines', () => {
    const blocks = toDescriptionBlocks('Premier bloc.\n\nSecond bloc.');

    expect(blocks).toEqual([paragraph('Premier bloc.'), paragraph('Second bloc.')]);
  });

  it('collects consecutive bullets into one list, whatever the marker', () => {
    const blocks = toDescriptionBlocks('- Concevoir les écrans\n• Faire évoluer les services');

    expect(blocks).toEqual([list(['Concevoir les écrans', 'Faire évoluer les services'])]);
  });

  it('flags a lead-in line so it can hug what it introduces', () => {
    const blocks = toDescriptionBlocks(
      'Vos missions :\n- Concevoir\n\nProfil recherché :\nTrois ans.',
    );

    expect(blocks).toEqual([
      paragraph('Vos missions :', true),
      list(['Concevoir']),
      paragraph('Profil recherché :', true),
      paragraph('Trois ans.'),
    ]);
  });

  it('does not treat a long sentence ending in a colon as a lead-in', () => {
    const long = `${'a'.repeat(95)} :`;

    expect(toDescriptionBlocks(`${long}\nSuite.`)).toEqual([paragraph(`${long} Suite.`)]);
  });
});
