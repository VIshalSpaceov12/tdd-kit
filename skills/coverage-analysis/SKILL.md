---
name: coverage-analysis
description: Use when asked to review test coverage or decide where to add tests - reads a coverage summary and ranks the riskiest gaps
---

# Coverage Analysis (tdd-kit)

Turn a coverage report into a short, prioritized list of where to add tests.

## Steps
1. Locate the coverage summary (e.g. `coverage/coverage-summary.json` from `--coverage`). If none
   exists, instruct the user to run tests with coverage enabled first.
2. Rank files by lowest line/branch coverage, weighted toward business-critical paths (auth,
   payments, booking/OTP lifecycle, money math).
3. For the top few, name the specific uncovered functions/branches and propose concrete test cases.
4. Do **not** edit the XLSX report — coverage is advisory and lives outside the default report.
