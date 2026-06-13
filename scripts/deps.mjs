import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Decide where to resolve the runtime deps (xlsx, fast-xml-parser) from.
// - Marketplace install: the plugin is copied to a cache dir WITHOUT its gitignored
//   node_modules, so the SessionStart hook installs deps into ${CLAUDE_PLUGIN_DATA}.
//   Returns that dir's package.json as the createRequire base (resolves its node_modules).
// - Dev / --plugin-dir / tests: returns null → resolve from the plugin's own node_modules.
// NOTE: NODE_PATH does not affect ESM `import`, so we resolve via createRequire instead.
export function chooseDepsBase(dataDir, exists = existsSync) {
  if (dataDir && exists(join(dataDir, 'node_modules', 'xlsx'))) {
    return join(dataDir, 'package.json');
  }
  return null;
}

const base = chooseDepsBase(process.env.CLAUDE_PLUGIN_DATA);
const req = base ? createRequire(base) : createRequire(import.meta.url);

export const XLSX = req('xlsx');
export const { XMLParser } = req('fast-xml-parser');
