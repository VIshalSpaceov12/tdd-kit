# tdd-kit — Design Spec

**Date:** 2026-06-13
**Status:** Approved (pending spec review)
**Author:** Vishal Parmar

## Purpose

A reusable, skills-first Claude Code **plugin** (modeled on the `superpowers` plugin) that brings a
test-driven-development workflow to any project and produces an **XLSX test-results report** on
demand. Built and dogfooded against the Car Rental monorepo, then installed across all projects.

Two readings of "include TDD", both honored:
1. The plugin **ships a TDD-discipline skill** (RED → GREEN → REFACTOR).
2. The plugin's **own code is built test-first** (its normalizers and workbook builder are pure
   functions with Vitest tests written before implementation).

## Scope

In scope (the approved "Full suite"):
- A TDD-discipline skill.
- A `/tdd-kit:report` slash command — the primary, explicit trigger that runs the test suite and
  writes the XLSX.
- A coverage-analysis skill (guidance only; coverage is **not** in the default XLSX).
- An **opt-in** auto-export hook (off by default).
- A `marketplace.json` so the plugin installs into any project.

Out of scope (deferred, not built now):
- A "Coverage" sheet in the XLSX (kept behind a future flag).
- Non-JS test runners beyond what JUnit XML already covers.
- Publishing to the public community marketplace.

## Distribution & location

- The plugin lives in its **own git repo** at `~/Documents/Projects/tdd-kit` — not inside any app
  repo, so it stays uncoupled and reusable.
- A `marketplace.json` at the repo root makes it installable:
  `claude plugin marketplace add ~/Documents/Projects/tdd-kit` then
  `claude plugin install tdd-kit`.
- Dogfooded in the Car Rental monorepo via
  `claude plugin install ~/Documents/Projects/tdd-kit --scope local`.

## Directory layout

```
tdd-kit/
├── .claude-plugin/
│   ├── plugin.json              # manifest (only file allowed in this dir)
│   └── marketplace.json         # installable-anywhere metadata
├── skills/
│   ├── test-driven-development/SKILL.md
│   └── coverage-analysis/SKILL.md
├── commands/
│   └── report.md                # /tdd-kit:report
├── hooks/
│   └── hooks.json               # Stop hook, gated by userConfig.auto_report
├── scripts/
│   ├── collect-and-report.mjs   # orchestrator CLI
│   ├── auto-report.sh           # Stop-hook wrapper; no-op unless auto_report=true
│   ├── normalize/
│   │   ├── junit.mjs
│   │   ├── vitest.mjs
│   │   └── jest.mjs
│   └── build-workbook.mjs       # pure: normalized model → SheetJS workbook
├── test/
│   ├── fixtures/                # sample junit.xml, vitest.json, jest.json
│   ├── normalize.test.mjs
│   ├── build-workbook.test.mjs
│   └── collect-and-report.test.mjs   # integration
├── package.json                 # plugin's own deps + test script (Vitest)
├── README.md
└── docs/superpowers/specs/2026-06-13-tdd-kit-plugin-design.md
```

## Manifest (`.claude-plugin/plugin.json`)

```json
{
  "name": "tdd-kit",
  "displayName": "TDD Kit",
  "version": "0.1.0",
  "description": "TDD workflow skill plus a /tdd-kit:report command that runs the suite and exports results to XLSX.",
  "author": { "name": "Vishal Parmar" },
  "homepage": "https://github.com/VIshalSpaceov12/tdd-kit",
  "repository": "https://github.com/VIshalSpaceov12/tdd-kit.git",
  "keywords": ["tdd", "testing", "xlsx", "report", "workflow"],
  "userConfig": {
    "xlsx_output_dir": {
      "type": "directory",
      "title": "XLSX output directory",
      "description": "Where test-result reports are written.",
      "default": "./test-reports",
      "required": false
    },
    "auto_report": {
      "type": "boolean",
      "title": "Auto-export on Stop",
      "description": "Regenerate the XLSX automatically when Claude finishes. Off by default.",
      "default": false
    }
  }
}
```

## Components

### Skill: `test-driven-development`
Lean RED → GREEN → REFACTOR discipline. Distinct from the superpowers skill of the same name in that
it ends the GREEN step by pointing at `/tdd-kit:report` to capture a results artifact. Self-contained
so it works in projects that don't have superpowers installed. Namespacing
(`tdd-kit:test-driven-development`) prevents any collision.

### Skill: `coverage-analysis`
Model-invocable. Reads a coverage summary (e.g. `coverage/coverage-summary.json`), highlights the
lowest-covered files, and suggests where to add tests. Does not write to the XLSX.

### Command: `commands/report.md` → `/tdd-kit:report [workspace-filter]`
The primary trigger. Instructions to Claude:
1. Run the project's test command emitting machine-readable output — **prefer JUnit XML** if the
   project has a junit reporter configured, otherwise **fall back to native JSON**
   (`vitest run --reporter=json`, `jest --json`), which needs no new dependencies.
2. Invoke `scripts/collect-and-report.mjs` with the produced report file(s).
3. Report the written XLSX path and a one-line summary (totals + pass rate).
- Optional argument: a workspace/path filter passed through to the test command.

### Hook: `hooks/hooks.json`
A single `Stop` hook that runs the orchestrator, **only when `userConfig.auto_report` is true**. The
slash command remains the real trigger; this is convenience for those who opt in.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/auto-report.sh \"${user_config.xlsx_output_dir}\" \"${user_config.auto_report}\""
          }
        ]
      }
    ]
  }
}
```
`auto-report.sh` exits immediately when the toggle is not `"true"`.

## Scripts & dependencies

- Core deps: **`xlsx` (SheetJS)** for workbook generation, **`fast-xml-parser`** for JUnit XML.
- Installed into **`${CLAUDE_PLUGIN_DATA}`** (persists across plugin updates; never touches the user's
  project `node_modules`). The orchestrator resolves the module path from that directory.
- All script paths referenced via `${CLAUDE_PLUGIN_ROOT}`; no absolute paths.

### Orchestrator CLI (`collect-and-report.mjs`)
```
node collect-and-report.mjs \
  --input <path>[:label] [--input <path>[:label] ...] \
  --format auto|junit|vitest|jest \
  --out <dir> \
  --timestamp <iso>
```
- `--input` accepts a file or directory; an optional `:label` tags the source (used as the workspace
  column). Multiple inputs merge into one report (monorepo case: one per workspace).
- `--format auto` detects per file by extension + content sniff.
- `--timestamp` is passed in by the caller so output filenames are deterministic in tests.

## Normalized data model (the contract between layers)

```
TestRun {
  timestamp: string            // ISO
  totals: { total, passed, failed, skipped }
  durationMs: number
  suites: Suite[]
}
Suite { name: string, label?: string, file?: string, tests: TestCase[] }
TestCase {
  suite: string,
  name: string,
  status: 'passed' | 'failed' | 'skipped',
  durationMs: number,
  failureMessage?: string,
  file?: string
}
```

Each normalizer (`junit`, `vitest`, `jest`) maps its raw format to `TestRun`. `build-workbook.mjs`
consumes only `TestRun` — it never sees raw runner output. This is the seam that keeps each unit
testable in isolation.

## XLSX format (Summary + per-test rows)

- **Sheet "Summary":**
  - Key/value rows: `Generated`, `Total`, `Passed`, `Failed`, `Skipped`, `Pass rate`,
    `Total duration (ms)`.
  - A per-suite/workspace breakdown table: `Suite/Workspace · Total · Passed · Failed · Skipped`.
- **Sheet "Tests":** header + one row per `TestCase`:
  `Workspace/Suite · Test name · Status · Duration (ms) · Failure message (truncated) · File`.
- Output path: `${xlsx_output_dir}/test-results-<timestamp>.xlsx` (default dir `./test-reports/`).

## Error handling (only real cases)

- No report files found → exit non-zero with a clear message ("no test output to report; run tests
  with a JSON or JUnit reporter first"). The command surfaces this to the user.
- Unparseable/empty report file → skip that file, warn, continue with the rest; fail only if nothing
  parsed.
- Output directory missing → create it.

## Cross-runner reality in the Car Rental monorepo (validation target)

- Vitest (api, dashboard, types, tokens) + Jest (mobile). Root `npm test` fans out per workspace.
- **Native JSON path = zero new project deps**, works today.
- **JUnit path** (the cross-project portability win) needs a per-project reporter: Vitest's `junit`
  reporter is config-only; **Jest needs the `jest-junit` devDep** — documented as opt-in, never
  forced. This is the only project-level dependency the plugin can ask for, and only when a user
  chooses the JUnit path.
- No Prisma migrations or env vars — the plugin does not touch app backends.

## Build plan — test-first increments

Each increment: write the failing Vitest test against a committed fixture, then implement to green.
1. `junit` normalizer: fixture `junit.xml` → expected `TestRun`.
2. `vitest` normalizer: fixture `vitest.json` → expected `TestRun`.
3. `jest` normalizer: fixture `jest.json` → expected `TestRun`.
4. `build-workbook`: `TestRun` → workbook; assert specific Summary cells and Tests rows.
5. Merge/totals: multiple inputs → single `TestRun` with correct aggregated totals.
6. `collect-and-report` integration: run a tiny throwaway suite → assert the XLSX exists and its
   Summary totals match.

## Success criteria

- `/tdd-kit:report` in the Car Rental monorepo produces a valid `.xlsx` with accurate Summary totals
  and one row per test, from native JSON with no new project deps.
- The same command works against a JUnit XML report.
- The plugin installs cleanly into a second, unrelated project.
- The plugin's own Vitest suite is green; normalizers and workbook builder were written test-first.
