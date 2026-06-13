# tdd-kit

A reusable Claude Code plugin: a TDD-discipline skill plus `/tdd-kit:report`, which runs your test
suite and exports a two-sheet XLSX (Summary + per-test rows). Works with Vitest, Jest, and any
runner that emits JUnit XML.

## Install

```bash
git clone https://github.com/VIshalSpaceov12/tdd-kit.git ~/Documents/Projects/tdd-kit
cd ~/Documents/Projects/tdd-kit && npm install
claude plugin marketplace add ~/Documents/Projects/tdd-kit
claude plugin install tdd-kit
```

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
