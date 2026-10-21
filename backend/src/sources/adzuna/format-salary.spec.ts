import { describe, expect, it } from 'vitest';

import { formatSalary } from './format-salary.js';

/**
 * Yearly salary label from Adzuna's bounds.
 */
describe('formatSalary', () => {
  it('renders a range in French formatting', () => {
    expect(formatSalary(40000, 50000)).toBe('40 000 € - 50 000 € par an');
  });

  it('renders a single figure when both bounds are equal or one is missing', () => {
    expect(formatSalary(45000, 45000)).toBe('45 000 € par an');
    expect(formatSalary(undefined, 50000)).toBe('50 000 € par an');
    expect(formatSalary(42000.4)).toBe('42 000 € par an');
  });

  it('reads a zero bound as unknown rather than as zero euros', () => {
    expect(formatSalary(0, 50000)).toBe('50 000 € par an');
    expect(formatSalary(50000, 0)).toBe('50 000 € par an');
  });

  it('answers null when nothing is known', () => {
    expect(formatSalary()).toBeNull();
    expect(formatSalary(0, 0)).toBeNull();
  });
});
