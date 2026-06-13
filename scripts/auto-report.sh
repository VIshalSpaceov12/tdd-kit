#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-./test-reports}"
ENABLED="${2:-false}"

# Opt-in only: do nothing unless the user enabled auto_report.
if [ "$ENABLED" != "true" ]; then
  exit 0
fi

echo "tdd-kit: auto_report is enabled. Run /tdd-kit:report to generate the XLSX for this session." >&2
# Intentionally does not run tests here — test invocation is the command's job, to avoid
# surprise long/expensive runs on every Stop. This hook only surfaces the reminder.
exit 0
