/**
 * Feature 039 — unit smoke for tab deep-link helpers.
 * Usage: node src/features/trainer/client-360/client360Tabs.test.mjs
 */
import { CLIENT_360_TABS, normalizeClient360Tab } from './client360Tabs.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(CLIENT_360_TABS.length === 7, 'expected 7 sections');
assert(normalizeClient360Tab('programacion') === 'programacion', 'programacion');
assert(normalizeClient360Tab('CHECKINS') === 'checkins', 'case fold');
assert(normalizeClient360Tab('') === 'resumen', 'empty → resumen');
assert(normalizeClient360Tab('nope') === 'resumen', 'unknown → resumen');
assert(normalizeClient360Tab(null) === 'resumen', 'null → resumen');

console.log('[test-039-tabs] PASS');
