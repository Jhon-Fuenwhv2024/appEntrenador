/**
 * Decision table for Feature 029 set advance / rest (mirrors useWorkoutSession.completeSet).
 * Run: node src/features/client/composables/supersetAdvance.test.mjs
 */

function resolveAdjacentSupersetGroup(exercises, index) {
  const list = Array.isArray(exercises) ? exercises : [];
  if (index < 0 || index >= list.length) {
    return { start: index, end: index, letter: null };
  }
  const raw = list[index]?.superset_letter;
  const letter = typeof raw === 'string' && raw.trim()
    ? raw.trim().toUpperCase()
    : null;
  if (!letter) return { start: index, end: index, letter: null };

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

/**
 * @returns {'nextInGroup'|'startRest'|'nextAfterGroup'|'restLinear'|'nextExercise'|'finished'}
 */
function decideAfterCompleteSet(exercises, exerciseIndex, setIndex) {
  const group = resolveAdjacentSupersetGroup(exercises, exerciseIndex);
  const inMultiGroup = group.letter != null && group.end > group.start;
  const series = Number(exercises[exerciseIndex]?.series) || 0;
  const isLastSet = setIndex + 1 >= series;
  const isLastExercise = exerciseIndex >= exercises.length - 1;

  if (inMultiGroup) {
    if (exerciseIndex < group.end) return 'nextInGroup';
    const groupHasMoreSets = exercises
      .slice(group.start, group.end + 1)
      .some((member) => setIndex + 1 < (Number(member.series) || 0));
    if (groupHasMoreSets) return 'startRest';
    if (group.end + 1 < exercises.length) return 'nextAfterGroup';
    return 'finished';
  }

  if (!isLastSet) return 'restLinear';
  if (!isLastExercise) return 'nextExercise';
  return 'finished';
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

const ss = [
  { nombre: 'Press', series: 2, superset_letter: 'A' },
  { nombre: 'Remo', series: 2, superset_letter: 'A' },
  { nombre: 'Curl', series: 1, superset_letter: null },
];

assert(decideAfterCompleteSet(ss, 0, 0) === 'nextInGroup', 'A1 set1 → nextInGroup');
assert(decideAfterCompleteSet(ss, 1, 0) === 'startRest', 'A2 set1 → startRest');
assert(decideAfterCompleteSet(ss, 0, 1) === 'nextInGroup', 'A1 set2 → nextInGroup');
assert(decideAfterCompleteSet(ss, 1, 1) === 'nextAfterGroup', 'A2 set2 → Curl');
assert(decideAfterCompleteSet(ss, 2, 0) === 'finished', 'Curl done → finished');

const wrong = [
  { nombre: '1A', series: 2, superset_letter: 'A' },
  { nombre: '1B', series: 2, superset_letter: 'B' },
];
assert(decideAfterCompleteSet(wrong, 0, 0) === 'restLinear', 'A≠B: rest after first set (not superserie)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
