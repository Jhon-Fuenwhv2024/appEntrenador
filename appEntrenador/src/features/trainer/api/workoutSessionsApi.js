import http from '../../../shared/api/http.js';

/**
 * @param {number} clientId
 * @param {{ limit?: number, offset?: number }} [params]
 */
export function getClientWorkoutSessions(clientId, params = {}) {
  const query = {};
  if (params.limit != null) query.limit = params.limit;
  if (params.offset != null) query.offset = params.offset;
  return http.get(`/clients/${clientId}/workout-sessions`, { params: query });
}
