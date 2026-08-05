#!/usr/bin/env node
// Compares every locale file's key set against locales/fr.ts (the reference) and reports any
// missing or extra key. Run after editing any locale file: `node scripts/check-locale-keys.js`.

const path = require('path');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ rootDir: path.join(__dirname, '..') });
require('ts-node/register/transpile-only');

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'pt'];
const REFERENCE = 'fr';

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function loadLocale(id) {
  const mod = require(path.join('..', 'locales', id));
  return mod.default ?? mod;
}

const referenceKeys = new Set(collectKeys(loadLocale(REFERENCE)));
let hasDiscrepancy = false;

for (const id of LOCALES) {
  if (id === REFERENCE) continue;
  const keys = new Set(collectKeys(loadLocale(id)));

  const missing = [...referenceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !referenceKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✓ ${id}.ts — matches fr.ts (${keys.size} keys)`);
    continue;
  }

  hasDiscrepancy = true;
  console.log(`✗ ${id}.ts — mismatch vs fr.ts`);
  if (missing.length) {
    console.log(`  missing (${missing.length}):`);
    missing.forEach((k) => console.log(`    - ${k}`));
  }
  if (extra.length) {
    console.log(`  extra (${extra.length}):`);
    extra.forEach((k) => console.log(`    + ${k}`));
  }
}

if (hasDiscrepancy) {
  console.log('\nDiscrepancies found.');
  process.exit(1);
} else {
  console.log('\nAll locale files match fr.ts exactly.');
}
