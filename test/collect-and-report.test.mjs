import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import * as XLSX from 'xlsx';
import { collectAndReport } from '../scripts/collect-and-report.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'tdd-kit-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('collectAndReport', () => {
  it('merges multiple inputs and writes a timestamped XLSX', async () => {
    const outPath = await collectAndReport({
      inputs: [
        { path: join(here, 'fixtures/junit.xml'), label: 'api', format: 'auto' },
        { path: join(here, 'fixtures/jest.json'), label: 'mobile', format: 'auto' },
      ],
      out: tmp,
      timestamp: '2026-06-13T10:00:00.000Z',
    });

    expect(outPath).toBe(join(tmp, 'test-results-2026-06-13T10-00-00-000Z.xlsx'));
    expect(existsSync(outPath)).toBe(true);

    const wb = XLSX.readFile(outPath);
    const summary = XLSX.utils.sheet_to_json(wb.Sheets.Summary, { header: 1, blankrows: true });
    const find = (k) => summary.find((r) => r[0] === k)[1];
    // junit fixture: 3 tests (1 pass, 1 fail, 1 skip); jest fixture: 2 tests (1 pass, 1 skip)
    expect(find('Total')).toBe(5);
    expect(find('Passed')).toBe(2);
    expect(find('Failed')).toBe(1);
    expect(find('Skipped')).toBe(2);
  });

  it('throws a clear error when no inputs resolve', async () => {
    await expect(
      collectAndReport({ inputs: [], out: tmp, timestamp: '2026-06-13T10:00:00.000Z' }),
    ).rejects.toThrow(/no test output/i);
  });
});
