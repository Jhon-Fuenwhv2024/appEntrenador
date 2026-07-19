/**
 * Taxonomía de músculos (HITL + catálogo + pickers).
 * Mantener alineada con backend/.../admin-exercises/muscleTaxonomy.js
 */
export const MUSCLE_OPTIONS = [
  'Pecho',
  'Espalda',
  'Dorsal',
  'Trapecio',
  'Hombros',
  'Bíceps',
  'Braquial',
  'Tríceps',
  'Antebrazo',
  'Core/Abdomen',
  'Oblicuos',
  'Cuádriceps',
  'Femoral',
  'Glúteo',
  'Aductores',
  'Abductores',
  'Gemelos',
  'Pierna',
  'Cardio',
  'Full Body',
];

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseSecondaryMuscles(raw) {
  if (Array.isArray(raw)) {
    return raw.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim());
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim())
      : [];
  } catch {
    return [];
  }
}

/**
 * Filtro estilo Hevy: músculo principal o secundario + opcional calentamiento.
 * @param {object} exercise
 * @param {string|null|undefined} muscle
 * @param {boolean} [onlyWarmup]
 */
export function exerciseMatchesMuscleFilter(exercise, muscle, onlyWarmup = false) {
  if (onlyWarmup && !exercise?.is_warmup) return false;
  if (!muscle) return true;
  if (exercise?.primary_muscle === muscle) return true;
  return parseSecondaryMuscles(exercise?.secondary_muscles).includes(muscle);
}
