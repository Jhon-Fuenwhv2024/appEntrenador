import http from '../../../shared/api/http.js';

/**
 * @param {string|{ q?: string, limit?: number, page?: number }} [options]
 */
export function getExercises(options) {
  const params = {};
  if (typeof options === 'string') {
    if (options) params.q = options;
  } else if (options && typeof options === 'object') {
    if (options.q) params.q = options.q;
    if (options.limit != null) params.limit = options.limit;
    if (options.page != null) params.page = options.page;
  }
  return http.get('/exercises', {
    params: Object.keys(params).length ? params : undefined,
  });
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
