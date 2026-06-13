---
description: Run the test suite and export the results to an XLSX report.
argument-hint: "[workspace or path filter]"
---

# /tdd-kit:report

Run the project's tests with machine-readable output, then export a two-sheet XLSX
(Summary + Tests) using this plugin's bundled engine.

## Steps

1. **Find the test command.** Read the nearest `package.json`. In an npm-workspaces monorepo,
   plan to produce one report file per workspace.
2. **Produce machine-readable output**, preferring JUnit XML when configured, else native JSON:
   - Vitest JSON: `vitest run --reporter=json --outputFile=<tmp>/<ws>.json`
   - Jest JSON: `jest --json --outputFile=<tmp>/<ws>.json`
   - JUnit XML (if a junit reporter is configured): write `<tmp>/<ws>.xml`
   If `$ARGUMENTS` is provided, pass it through as a path/name filter to the test command.
3. **Build the report.** Pass every produced file to the engine, tagging each with its workspace:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/collect-and-report.mjs" \
     --input <tmp>/api.json:api \
     --input <tmp>/tokens.json:tokens \
     --out "${CLAUDE_PLUGIN_OPTION_XLSX_OUTPUT_DIR:-./test-reports}" \
     --timestamp "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
   ```
4. **Report back** the written `.xlsx` path and a one-line summary (total / passed / failed / pass rate).

## Notes
- Native JSON needs no new project dependencies. JUnit XML for Jest requires the `jest-junit` devDep.
- The engine's deps (`xlsx`, `fast-xml-parser`) are bootstrapped automatically: a SessionStart hook
  installs them into `${CLAUDE_PLUGIN_DATA}` on first run after a marketplace install. In
  `--plugin-dir` dev mode they resolve from the plugin's own `node_modules`. No manual step.
