import { describe, it, expect, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '..', 'scripts', 'bootstrap-deps.sh');
const tmps = [];
const mkTmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'tddkit-boot-'));
  tmps.push(d);
  return d;
};
afterAll(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })));

function run(env) {
  try {
    const out = execSync(`bash "${script}" 2>&1`, {
      env: { PATH: process.env.PATH, ...env },
      encoding: 'utf8',
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout ?? '').toString() };
  }
}

describe('bootstrap-deps.sh', () => {
  it('is a no-op in dev mode when the plugin root already has node_modules/xlsx', () => {
    const root = mkTmp();
    const data = mkTmp();
    mkdirSync(join(root, 'node_modules', 'xlsx'), { recursive: true });

    const { code } = run({ CLAUDE_PLUGIN_ROOT: root, CLAUDE_PLUGIN_DATA: data });

    expect(code).toBe(0);
    // It must NOT have installed anything into the data dir.
    expect(existsSync(join(data, 'node_modules'))).toBe(false);
  });

  it('skips cleanly (without npm) when CLAUDE_PLUGIN_DATA is unset', () => {
    const root = mkTmp(); // no node_modules → not dev mode

    const { code, out } = run({ CLAUDE_PLUGIN_ROOT: root });

    expect(code).toBe(0);
    expect(out).toMatch(/CLAUDE_PLUGIN_DATA unset/i);
  });
});
