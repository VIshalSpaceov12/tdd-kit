import { basename } from 'node:path';

function mapStatus(raw) {
  if (raw === 'passed') return 'passed';
  if (raw === 'failed') return 'failed';
  return 'skipped'; // pending | skipped | todo | disabled
}

export function normalizeNativeJson(json, label) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  return (data.testResults ?? []).map((result) => {
    const file = result.name;
    const tests = (result.assertionResults ?? []).map((assertion) => {
      const status = mapStatus(assertion.status);
      const suite = (assertion.ancestorTitles ?? []).join(' > ') || basename(file ?? '');
      return {
        suite,
        name: assertion.title,
        status,
        durationMs: Math.round(assertion.duration ?? 0),
        failureMessage:
          status === 'failed'
            ? (assertion.failureMessages ?? []).join('\n') || 'failed'
            : undefined,
        file,
      };
    });
    return { name: basename(file ?? 'unknown'), label, file, tests };
  });
}
