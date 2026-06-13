import { XMLParser } from 'fast-xml-parser';

const toArray = (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

function statusOf(testcase) {
  if (testcase.skipped !== undefined) return 'skipped';
  if (testcase.failure !== undefined || testcase.error !== undefined) return 'failed';
  return 'passed';
}

function failureMessageOf(testcase) {
  const node = testcase.failure ?? testcase.error;
  if (node === undefined) return undefined;
  const first = Array.isArray(node) ? node[0] : node;
  if (typeof first === 'string') return first;
  return first['@_message'] ?? first['#text'] ?? 'failed';
}

export function normalizeJUnit(xml, label) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const suiteNodes = parsed.testsuites
    ? toArray(parsed.testsuites.testsuite)
    : toArray(parsed.testsuite);

  return suiteNodes.map((suite) => {
    const name = suite['@_name'] ?? 'unknown';
    const file = suite['@_file'];
    const tests = toArray(suite.testcase).map((tc) => {
      const status = statusOf(tc);
      return {
        suite: name,
        name: tc['@_name'] ?? 'unknown',
        status,
        durationMs: Math.round(parseFloat(tc['@_time'] ?? '0') * 1000),
        failureMessage: status === 'failed' ? failureMessageOf(tc) : undefined,
        file: tc['@_classname'] ?? file ?? name,
      };
    });
    return { name, label, file, tests };
  });
}
