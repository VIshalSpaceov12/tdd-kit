import * as XLSX from 'xlsx';

function passRate(totals) {
  if (totals.total === 0) return '0%';
  return `${Math.round((totals.passed / totals.total) * 1000) / 10}%`;
}

function suiteLabel(suite) {
  return suite.label ? `${suite.label} · ${suite.name}` : suite.name;
}

function breakdownRow(suite) {
  const t = { total: 0, passed: 0, failed: 0, skipped: 0 };
  for (const test of suite.tests) {
    t.total += 1;
    t[test.status] += 1;
  }
  return [suiteLabel(suite), t.total, t.passed, t.failed, t.skipped];
}

export function buildWorkbook(run) {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ['Generated', run.timestamp],
    ['Total', run.totals.total],
    ['Passed', run.totals.passed],
    ['Failed', run.totals.failed],
    ['Skipped', run.totals.skipped],
    ['Pass rate', passRate(run.totals)],
    ['Total duration (ms)', run.durationMs],
    [],
    ['Suite/Workspace', 'Total', 'Passed', 'Failed', 'Skipped'],
    ...run.suites.map(breakdownRow),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

  const testRows = [
    ['Workspace/Suite', 'Test name', 'Status', 'Duration (ms)', 'Failure message', 'File'],
    ...run.suites.flatMap((suite) =>
      suite.tests.map((test) => [
        suite.label ? `${suite.label} · ${test.suite}` : test.suite,
        test.name,
        test.status,
        test.durationMs,
        (test.failureMessage ?? '').slice(0, 500),
        test.file ?? '',
      ]),
    ),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(testRows), 'Tests');

  return wb;
}

export function writeWorkbook(run, outPath) {
  XLSX.writeFile(buildWorkbook(run), outPath);
  return outPath;
}
