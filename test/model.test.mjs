import { describe, it, expect } from 'vitest';
import { computeTotals, sumDuration, makeRun } from '../scripts/model.mjs';

const suites = [
  {
    name: 'a.test.ts',
    label: 'api',
    tests: [
      { suite: 'a', name: 't1', status: 'passed', durationMs: 10 },
      { suite: 'a', name: 't2', status: 'failed', durationMs: 20 },
    ],
  },
  {
    name: 'b.test.ts',
    label: 'web',
    tests: [
      { suite: 'b', name: 't3', status: 'skipped', durationMs: 0 },
      { suite: 'b', name: 't4', status: 'passed', durationMs: 5 },
    ],
  },
];

describe('model', () => {
  it('computeTotals aggregates across suites', () => {
    expect(computeTotals(suites)).toEqual({ total: 4, passed: 2, failed: 1, skipped: 1 });
  });

  it('sumDuration adds every test duration', () => {
    expect(sumDuration(suites)).toBe(35);
  });

  it('makeRun assembles a TestRun with the supplied timestamp', () => {
    const run = makeRun(suites, '2026-06-13T10:00:00.000Z');
    expect(run.timestamp).toBe('2026-06-13T10:00:00.000Z');
    expect(run.totals).toEqual({ total: 4, passed: 2, failed: 1, skipped: 1 });
    expect(run.durationMs).toBe(35);
    expect(run.suites).toBe(suites);
  });
});
