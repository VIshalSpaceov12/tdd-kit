import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { chooseDepsBase, XLSX, XMLParser } from '../scripts/deps.mjs';

describe('chooseDepsBase', () => {
  it('prefers the plugin data dir when it has node_modules/xlsx installed', () => {
    const exists = (p) => p === join('/data', 'node_modules', 'xlsx');
    expect(chooseDepsBase('/data', exists)).toBe(join('/data', 'package.json'));
  });

  it('falls back (null) when the data dir lacks installed deps', () => {
    expect(chooseDepsBase('/data', () => false)).toBeNull();
  });

  it('falls back (null) when no data dir is set', () => {
    expect(chooseDepsBase(undefined, () => true)).toBeNull();
  });
});

describe('deps exports', () => {
  it('exposes a working XLSX (utils + writeFile)', () => {
    expect(typeof XLSX.utils.aoa_to_sheet).toBe('function');
    expect(typeof XLSX.writeFile).toBe('function');
  });

  it('exposes a constructable XMLParser', () => {
    const parser = new XMLParser();
    expect(typeof parser.parse).toBe('function');
  });
});
