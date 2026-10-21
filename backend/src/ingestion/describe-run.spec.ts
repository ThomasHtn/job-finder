import { describe, expect, it } from 'vitest';

import { describeCrash, describeRun } from './describe-run.js';
import { emptySummary } from './empty-summary.js';

/**
 * One-line reports sent to the push monitor.
 */
describe('describeRun', () => {
  it('sums up a healthy run with the sources left unconfigured', () => {
    const summary = { ...emptySummary(), skippedSources: ['ADZUNA'], kept: 132, inserted: 4 };

    expect(describeRun(summary, [], 6)).toEqual({
      status: 'up',
      msg: '6 sources ok (1 not configured), 132 kept, 4 new',
    });
  });

  it('lists the failed sources with a short reason', () => {
    const report = describeRun(
      emptySummary(),
      [
        { source: 'FRANCE_TRAVAIL', error: '401 Unauthorized' },
        { source: 'APEC', error: 'x'.repeat(100) },
      ],
      7,
    );

    expect(report.status).toBe('down');
    expect(report.msg).toBe(
      `2 of 7 sources failed: FRANCE_TRAVAIL (401 Unauthorized), APEC (${'x'.repeat(57)}...)`,
    );
  });

  it('keeps the message short enough for an alert', () => {
    const failures = Array.from({ length: 10 }, () => ({
      source: 'APEC' as const,
      error: 'e'.repeat(60),
    }));

    expect(describeRun(emptySummary(), failures, 10).msg).toHaveLength(250);
  });
});

/**
 * Report of a run that never reached its end.
 */
describe('describeCrash', () => {
  it('names the cause', () => {
    expect(describeCrash(new Error('connection refused'))).toEqual({
      status: 'down',
      msg: 'Ingestion crashed: connection refused',
    });
  });
});
