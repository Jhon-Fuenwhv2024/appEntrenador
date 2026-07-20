import http from '../../../shared/api/http.js';

/**
 * Historial de check-ins + fotos del alumno (trainer dueño).
 * @param {number|string} clientId
 */
export function getClientCheckins(clientId) {
  return http.get(`/checkins/client/${clientId}`);
}

/**
 * Marca un check-in como revisado (trainer dueño).
 * @param {number|string} checkinId
 */
export function markCheckinReviewed(checkinId) {
  return http.patch(`/checkins/${checkinId}/review`);
}
