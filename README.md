# tdd-kit

A reusable Claude Code plugin: a TDD-discipline skill plus `/tdd-kit:report`, which runs your test
suite and exports a two-sheet XLSX (Summary + per-test rows). Works with Vitest, Jest, and any
runner that emits JUnit XML.

## Install

**Permanent install (all projects).** Marketplace install copies the plugin to a cache dir; a
SessionStart hook then installs the engine's deps (`xlsx`, `fast-xml-parser`) into the plugin's
persistent data dir on first run — no manual `npm install` needed.

```bash
claude plugin marketplace add VIshalSpaceov12/tdd-kit   # or a local path
claude plugin install tdd-kit
```

**Dev / try-it-in-place (single session).** Loads the repo directly, using its own `node_modules`:

```bash
git clone https://github.com/VIshalSpaceov12/tdd-kit.git ~/Documents/Projects/tdd-kit
cd ~/Documents/Projects/tdd-kit && npm install
claude --plugin-dir ~/Documents/Projects/tdd-kit
```

After editing the plugin, run `/reload-plugins`; inspect with `/plugin`.

## Use

- `/tdd-kit:report [filter]` — run tests and write `test-reports/test-results-<timestamp>.xlsx`.
- The `test-driven-development` and `coverage-analysis` skills activate automatically when relevant.

## Config (set at install time)

- `xlsx_output_dir` (default `./test-reports`)
- `auto_report` (default `false`)

## Report contents

- **Summary** sheet: totals (total / passed / failed / skipped), pass rate, total duration, and a
  per-suite/workspace breakdown.
- **Tests** sheet: one row per test — workspace/suite, name, status, duration, failure message, file.

## Notes

- Native Jest/Vitest JSON needs no extra project deps. JUnit XML for Jest needs the `jest-junit` devDep.
- The XLSX engine (`scripts/`) is plain Node ES modules covered by Vitest; run `npm test` to verify.
