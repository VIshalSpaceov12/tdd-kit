import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeJUnit } from '../scripts/normalize/junit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const xml = readFileSync(join(here, 'fixtures/junit.xml'), 'utf8');

describe('normalizeJUnit', () => {
  const suites = normalizeJUnit(xml, 'api');

  it('returns one suite tagged with the label', () => {
    expect(suites).toHaveLength(1);
    expect(suites[0].name).toBe('math.test.ts');
    expect(suites[0].label).toBe('api');
    expect(suites[0].file).toBe('src/math.test.ts');
    expect(suites[0].tests).toHaveLength(3);
  });

  it('maps a passing testcase', () => {
    expect(suites[0].tests[0]).toEqual({
      suite: 'math.test.ts',
      name: 'adds',
      status: 'passed',
      durationMs: 10,
      failureMessage: undefined,
      file: 'src/math.test.ts',
    });
  });

  it('maps a failing testcase with its message and seconds→ms', () => {
    expect(suites[0].tests[1]).toEqual({
      suite: 'math.test.ts',
      name: 'subtracts',
      status: 'failed',
      durationMs: 20,
      failureMessage: 'expected 1 to be 2',
      file: 'src/math.test.ts',
    });
  });

  it('maps a skipped testcase', () => {
    expect(suites[0].tests[2].status).toBe('skipped');
    expect(suites[0].tests[2].durationMs).toBe(0);
  });
});
