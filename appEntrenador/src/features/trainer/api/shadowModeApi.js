import http from '../../../shared/api/http.js';

export function getTrainerLiveSessions() {
  return http.get('/trainer/live-sessions');
}

/**
 * @param {number|string} clientId
 * @param {{ body: string, tone?: string }} payload
 */
export function postLiveCue(clientId, payload) {
  return http.post(`/trainer/live-sessions/${clientId}/cues`, payload);
}
