import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeNativeJson } from '../scripts/normalize/native-json.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, 'fixtures', f), 'utf8');

describe('normalizeNativeJson — Vitest output', () => {
  const suites = normalizeNativeJson(read('vitest.json'), 'tokens');

  it('derives suite name from the file basename and tags the label', () => {
    expect(suites).toHaveLength(1);
    expect(suites[0].name).toBe('theme.test.ts');
    expect(suites[0].label).toBe('tokens');
    expect(suites[0].file).toBe('/repo/packages/tokens/src/theme.test.ts');
  });

  it('maps passed and failed tests, joining ancestorTitles and failureMessages', () => {
    expect(suites[0].tests[0]).toEqual({
      suite: 'theme',
      name: 'resolves primary',
      status: 'passed',
      durationMs: 5,
      failureMessage: undefined,
      file: '/repo/packages/tokens/src/theme.test.ts',
    });
    expect(suites[0].tests[1]).toEqual({
      suite: 'theme',
      name: 'throws on missing token',
      status: 'failed',
      durationMs: 7,
      failureMessage: 'Error: missing color.danger',
      file: '/repo/packages/tokens/src/theme.test.ts',
    });
  });
});

describe('normalizeNativeJson — Jest output', () => {
  const suites = normalizeNativeJson(read('jest.json'), 'mobile');

  it('joins nested ancestorTitles with " > "', () => {
    expect(suites[0].tests[0].suite).toBe('tokens > rtl');
    expect(suites[0].tests[0].status).toBe('passed');
    expect(suites[0].tests[0].durationMs).toBe(12);
  });

  it('maps Jest "pending" to skipped', () => {
    expect(suites[0].tests[1].status).toBe('skipped');
    expect(suites[0].tests[1].failureMessage).toBeUndefined();
  });
});
