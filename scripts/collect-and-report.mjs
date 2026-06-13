import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { normalizeJUnit } from './normalize/junit.mjs';
import { normalizeNativeJson } from './normalize/native-json.mjs';
import { makeRun } from './model.mjs';
import { writeWorkbook } from './build-workbook.mjs';

function detectFormat(path, content) {
  if (path.endsWith('.xml')) return 'junit';
  if (path.endsWith('.json')) return 'native';
  return content.trimStart().startsWith('<') ? 'junit' : 'native';
}

export async function collectAndReport({ inputs, out, timestamp }) {
  const suites = [];
  for (const input of inputs) {
    const content = readFileSync(input.path, 'utf8');
    const format =
      input.format && input.format !== 'auto' ? input.format : detectFormat(input.path, content);
    const normalized =
      format === 'junit'
        ? normalizeJUnit(content, input.label)
        : normalizeNativeJson(content, input.label);
    suites.push(...normalized);
  }

  if (suites.length === 0) {
    throw new Error('no test output to report; run tests with a JSON or JUnit reporter first');
  }

  const run = makeRun(suites, timestamp);
  mkdirSync(out, { recursive: true });
  const stamp = timestamp.replace(/[:.]/g, '-');
  return writeWorkbook(run, join(out, `test-results-${stamp}.xlsx`));
}

function parseCli(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      input: { type: 'string', multiple: true },
      out: { type: 'string' },
      timestamp: { type: 'string' },
      format: { type: 'string', default: 'auto' },
    },
  });
  const inputs = (values.input ?? []).map((spec) => {
    const idx = spec.lastIndexOf(':');
    const hasLabel = idx > 1; // avoid splitting drive-less mac paths (none have ':')
    return {
      path: hasLabel ? spec.slice(0, idx) : spec,
      label: hasLabel ? spec.slice(idx + 1) : undefined,
      format: values.format,
    };
  });
  return { inputs, out: values.out ?? './test-reports', timestamp: values.timestamp };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const opts = parseCli(process.argv.slice(2));
  if (!opts.timestamp) opts.timestamp = new Date().toISOString();
  collectAndReport(opts)
    .then((path) => console.log(`Wrote ${path}`))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
