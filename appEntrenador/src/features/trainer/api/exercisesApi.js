import http from '../../../shared/api/http.js';

/** Max page size allowed by GET /exercises (backend MAX_LIST_LIMIT). */
const EXERCISES_PAGE_LIMIT = 100;
const MAX_CATALOG_PAGES = 50;

/**
 * @param {string|{ q?: string, limit?: number, page?: number, enriched?: boolean }} [options]
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
  }
  return http.get('/exercises', {
    params: Object.keys(params).length ? params : undefined,
  });
}

/**
 * Fetches the full trainer catalog by paging (API caps limit at 100).
 * Used by routine/template autocompletes that need every exercise.
 * @param {{ q?: string, enriched?: boolean }} [options]
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

export function createExercise(payload) {
  return http.post('/exercises', payload);
}

export function updateExercise(id, payload) {
  return http.put(`/exercises/${id}`, payload);
}

export function deleteExercise(id) {
  return http.delete(`/exercises/${id}`);
}
