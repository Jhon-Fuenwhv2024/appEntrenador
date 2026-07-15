/**
 * Pure tests for adjacent superserie grouping (no Vue timer / wav imports).
 * Run: node src/features/client/composables/supersetGroup.test.mjs
 */

/** Copy of resolveAdjacentSupersetGroup for isolated test (keep in sync). */
function resolveAdjacentSupersetGroup(exercises, index) {
  const list = Array.isArray(exercises) ? exercises : [];
  if (index < 0 || index >= list.length) {
    return { start: index, end: index, letter: null };
  }

  const raw = list[index]?.superset_letter;
  const letter = typeof raw === 'string' && raw.trim()
    ? raw.trim().toUpperCase()
    : null;

  if (!letter) {
    return { start: index, end: index, letter: null };
  }

  let start = index;
  while (start > 0) {
    const prev = list[start - 1]?.superset_letter;
    const prevLetter = typeof prev === 'string' && prev.trim()
      ? prev.trim().toUpperCase()
      : null;
    if (prevLetter !== letter) break;
    start -= 1;
  }

  let end = index;
  while (end < list.length - 1) {
    const next = list[end + 1]?.superset_letter;
    const nextLetter = typeof next === 'string' && next.trim()
      ? next.trim().toUpperCase()
      : null;
    if (nextLetter !== letter) break;
    end += 1;
  }

  return { start, end, letter };
}

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`OK  ${msg}`);
  } else {
    failed += 1;
    console.error(`FAIL ${msg}`);
  }
}

const sameLetter = [
  { nombre: 'Press', superset_letter: 'A' },
  { nombre: 'Remo', superset_letter: 'A' },
  { nombre: 'Curl', superset_letter: null },
];
assert(resolveAdjacentSupersetGroup(sameLetter, 0).end === 1, 'same letter A groups 0-1');
assert(resolveAdjacentSupersetGroup(sameLetter, 1).start === 0, 'same letter from index 1');
assert(resolveAdjacentSupersetGroup(sameLetter, 2).letter === null, 'null is singleton');

const wrongUx = [
  { nombre: '1A', superset_letter: 'A' },
  { nombre: '1B', superset_letter: 'B' },
];
assert(resolveAdjacentSupersetGroup(wrongUx, 0).end === 0, 'A then B are NOT one group');
assert(resolveAdjacentSupersetGroup(wrongUx, 1).end === 1, 'B alone');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
