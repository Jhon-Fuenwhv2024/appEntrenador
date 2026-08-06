import http from '../../../shared/api/http.js';

/** Max page size allowed by GET /exercises (backend MAX_LIST_LIMIT). */
const EXERCISES_PAGE_LIMIT = 100;
const MAX_CATALOG_PAGES = 50;

/** Optimización: menú del picker ≤40 filas (Feature 089). */
export const EXERCISE_PICKER_LIMIT = 40;

/**
 * @param {string|{
 *   q?: string,
 *   limit?: number,
 *   page?: number,
 *   enriched?: boolean,
 *   muscle?: string|null,
 *   warmup?: boolean,
 *   fields?: 'summary'|'full'|string,
 * }} [options]
 */
export function getExercises(options) {
  const params = {};
  if (typeof options === 'string') {
    if (options) params.q = options;
  } else if (options && typeof options === 'object') {
    if (options.q) params.q = options.q;
    if (options.limit != null) params.limit = options.limit;
    if (options.page != null) params.page = options.page;
    if (options.enriched) params.enriched = 1;
    if (options.muscle) params.muscle = options.muscle;
    if (options.warmup) params.warmup = 1;
    // Optimización: proyección slim sin description* (ADR-0012).
    if (options.fields) params.fields = options.fields;
  }
  return http.get('/exercises', {
    params: Object.keys(params).length ? params : undefined,
  });
}

/**
 * Fetches the trainer catalog by paging (API caps limit at 100).
 * Prefer `fields: 'summary'` for índices / autocomplete lookups.
 * @param {{ q?: string, enriched?: boolean, muscle?: string|null, warmup?: boolean, fields?: string }} [options]
 * @returns {Promise<object[]>}
 */
export async function getAllExercises(options = {}) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await getExercises({
      q: options.q,
      enriched: options.enriched,
      muscle: options.muscle,
      warmup: options.warmup,
      fields: options.fields,
      limit: EXERCISES_PAGE_LIMIT,
      page,
    });
    const batch = Array.isArray(res.data?.data) ? res.data.data : [];
    items.push(...batch);

    const meta = res.data?.meta;
    const metaPages = Number(meta?.totalPages);
    if (Number.isFinite(metaPages) && metaPages >= 1) {
      totalPages = metaPages;
    } else if (batch.length < EXERCISES_PAGE_LIMIT) {
      totalPages = page;
    } else {
      totalPages = page + 1;
    }

    page += 1;
  } while (page <= totalPages && page <= MAX_CATALOG_PAGES);

  return items;
}

/**
 * Optimización: resultados acotados para el menú del picker (Feature 089).
 * @param {{
 *   q?: string,
 *   enriched?: boolean,
 *   muscle?: string|null,
 *   warmup?: boolean,
 *   limit?: number,
 * }} [options]
 * @returns {Promise<object[]>}
 */
export async function searchExercisesForPicker(options = {}) {
  const res = await getExercises({
    q: options.q,
    enriched: options.enriched,
    muscle: options.muscle,
    warmup: options.warmup,
    fields: 'summary',
    limit: options.limit ?? EXERCISE_PICKER_LIMIT,
    page: 1,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export function createExercise(payload) {
  return http.post('/exercises', payload);
}

export function updateExercise(id, payload) {
  return http.put(`/exercises/${id}`, payload);
}

export function deleteExercise(id) {
  return http.delete(`/exercises/${id}`);
}
