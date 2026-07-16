import http from '../../../shared/api/http.js';

/**
 * Historial de check-ins + fotos del alumno (trainer dueño).
 * @param {number|string} clientId
 */
export function getClientCheckins(clientId) {
  return http.get(`/checkins/client/${clientId}`);
}
