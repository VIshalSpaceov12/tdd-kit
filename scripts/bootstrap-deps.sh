#!/usr/bin/env bash
# SessionStart hook: ensure the report engine's runtime deps (xlsx, fast-xml-parser)
# are available. Marketplace install copies the plugin WITHOUT its gitignored
# node_modules, so we install them once into the persistent plugin data dir.
set -euo pipefail

ROOT="${CLAUDE_PLUGIN_ROOT:?CLAUDE_PLUGIN_ROOT required}"
DATA="${CLAUDE_PLUGIN_DATA:-}"

# Dev / --plugin-dir mode: deps already live next to the scripts. Nothing to do.
if [ -d "$ROOT/node_modules/xlsx" ]; then
  exit 0
fi

# Marketplace/cache mode: install into the persistent data dir.
if [ -z "$DATA" ]; then
  echo "tdd-kit: CLAUDE_PLUGIN_DATA unset; skipping dep bootstrap." >&2
  exit 0
fi
mkdir -p "$DATA"

# Install ONLY the runtime deps (no dev toolchain) from a dedicated manifest.
# (Re)install only when deps are missing or that manifest changed.
MANIFEST="$ROOT/scripts/runtime-deps.json"
if [ ! -d "$DATA/node_modules/xlsx" ] || ! diff -q "$MANIFEST" "$DATA/package.json" >/dev/null 2>&1; then
  cp "$MANIFEST" "$DATA/package.json"
  if ( cd "$DATA" && npm install --no-audit --no-fund >"$DATA/bootstrap.log" 2>&1 ); then
    echo "tdd-kit: report-engine deps installed in plugin data dir." >&2
  else
    rm -f "$DATA/package.json"
    echo "tdd-kit: dep bootstrap failed; see $DATA/bootstrap.log" >&2
  fi
fi
exit 0
