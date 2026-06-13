export function computeTotals(suites) {
  const totals = { total: 0, passed: 0, failed: 0, skipped: 0 };
  for (const suite of suites) {
    for (const test of suite.tests) {
      totals.total += 1;
      totals[test.status] += 1;
    }
  }
  return totals;
}

export function sumDuration(suites) {
  let ms = 0;
  for (const suite of suites) {
    for (const test of suite.tests) {
      ms += test.durationMs || 0;
    }
  }
  return ms;
}

export function makeRun(suites, timestamp) {
  return {
    timestamp,
    totals: computeTotals(suites),
    durationMs: sumDuration(suites),
    suites,
  };
}
