import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { buildWorkbook } from '../scripts/build-workbook.mjs';

const run = {
  timestamp: '2026-06-13T10:00:00.000Z',
  totals: { total: 3, passed: 2, failed: 1, skipped: 0 },
  durationMs: 42,
  suites: [
    {
      name: 'math.test.ts',
      label: 'api',
      file: 'src/math.test.ts',
      tests: [
        { suite: 'math.test.ts', name: 'adds', status: 'passed', durationMs: 10, file: 'src/math.test.ts' },
        { suite: 'math.test.ts', name: 'subtracts', status: 'failed', durationMs: 20, failureMessage: 'expected 1 to be 2', file: 'src/math.test.ts' },
        { suite: 'math.test.ts', name: 'multiplies', status: 'passed', durationMs: 12, file: 'src/math.test.ts' },
      ],
    },
  ],
};

const aoa = (wb, sheet) =>
  XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, blankrows: true });
const findRow = (rows, key) => rows.find((r) => r[0] === key);

describe('buildWorkbook', () => {
  const wb = buildWorkbook(run);

  it('creates Summary and Tests sheets', () => {
    expect(wb.SheetNames).toEqual(['Summary', 'Tests']);
  });

  it('writes summary totals and pass rate', () => {
    const rows = aoa(wb, 'Summary');
    expect(findRow(rows, 'Generated')[1]).toBe('2026-06-13T10:00:00.000Z');
    expect(findRow(rows, 'Total')[1]).toBe(3);
    expect(findRow(rows, 'Passed')[1]).toBe(2);
    expect(findRow(rows, 'Failed')[1]).toBe(1);
    expect(findRow(rows, 'Pass rate')[1]).toBe('66.7%');
  });

  it('writes a per-suite breakdown row labelled with the workspace', () => {
    const rows = aoa(wb, 'Summary');
    const breakdown = findRow(rows, 'api · math.test.ts');
    expect(breakdown).toEqual(['api · math.test.ts', 3, 2, 1, 0]);
  });

  it('writes one Tests row per test case with a header', () => {
    const rows = aoa(wb, 'Tests');
    expect(rows[0]).toEqual(['Workspace/Suite', 'Test name', 'Status', 'Duration (ms)', 'Failure message', 'File']);
    const failing = rows.find((r) => r[1] === 'subtracts');
    expect(failing).toEqual(['api · math.test.ts', 'subtracts', 'failed', 20, 'expected 1 to be 2', 'src/math.test.ts']);
    // header + 3 tests
    expect(rows).toHaveLength(4);
  });
});
