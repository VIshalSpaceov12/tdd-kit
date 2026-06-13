---
name: test-driven-development
description: Use when implementing any feature or bugfix in a project that has tdd-kit installed - drives the RED-GREEN-REFACTOR loop and captures an XLSX result artifact via /tdd-kit:report
---

# Test-Driven Development (tdd-kit)

Write the test first. Watch it fail. Make it pass with the least code. Refactor. Repeat.

## The loop

1. **RED** — Write one small failing test that describes the next behavior. Run it; confirm it fails
   for the right reason (assertion, not a syntax/import error).
2. **GREEN** — Write the minimum code to make it pass. Run the test; confirm it passes.
3. **REFACTOR** — Clean up names/duplication with the test green. Re-run.
4. **CAPTURE** — When a meaningful slice is green, run `/tdd-kit:report` to write an XLSX of the
   current results, then commit.

## Rules
- One behavior per test. No implementation before a failing test exists.
- Never weaken a test to make it pass. Fix the code.
- Keep tests fast and isolated; no shared mutable state between tests.
