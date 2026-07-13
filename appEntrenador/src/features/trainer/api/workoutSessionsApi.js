import http from '../../../shared/api/http.js';

export function getClientWorkoutSessions(clientId) {
  return http.get(`/clients/${clientId}/workout-sessions`);
}
