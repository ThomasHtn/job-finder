import { JOB_SOURCES } from '@job-finder/contract';

import { SOURCE_STATES } from '@pages/jobs/source-board/source-board.constants';

import en from './en.json';
import fr from './fr.json';

/**
 * Translation tree: texts grouped by screen or feature.
 */
interface TranslationTree {
  /**
   * A text, or a group of texts.
   */
  readonly [key: string]: string | TranslationTree;
}

/**
 * Every text of a tree by its dotted key.
 */
function flatten(tree: TranslationTree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((texts, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...texts, [path]: value }
      : { ...texts, ...flatten(value, path) };
  }, {});
}

/**
 * Parameters of a text (`{{ count }}`), sorted.
 */
function params(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(([, name]) => name).sort();
}

describe('translation files', () => {
  const french = flatten(fr);
  const english = flatten(en);

  it('have the same keys in French and English', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(french).sort());
  });

  it('keep the parameters of each text', () => {
    const broken = Object.keys(french).filter(
      (key) =>
        english[key] !== undefined && params(english[key]).join() !== params(french[key]).join(),
    );
    expect(broken).toEqual([]);
  });

  it('name every source and every source health', () => {
    const needed = [
      ...JOB_SOURCES.map((source) => `sources.names.${source}`),
      ...SOURCE_STATES.map((state) => `sources.states.${state}`),
    ];
    expect(needed.filter((key) => french[key] === undefined)).toEqual([]);
  });
});
