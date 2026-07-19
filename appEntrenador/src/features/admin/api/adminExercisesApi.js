import http from '../../../shared/api/http.js';

/** GET /api/admin/exercises/untagged — siguiente ejercicio sin primary_muscle. */
export function getUntaggedExercise() {
  return http.get('/admin/exercises/untagged');
}

/**
 * PATCH /api/admin/exercises/:id/tag
 * @param {number|string} id
 * @param {{ primary_muscle: string, secondary_muscles?: string[] }} payload
 */
export function tagExercise(id, payload) {
  return http.patch(`/admin/exercises/${id}/tag`, payload);
}
