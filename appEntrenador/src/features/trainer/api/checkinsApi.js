import http from '../../../shared/api/http.js';

/**
 * Historial de check-ins + fotos del alumno (trainer dueño).
 * @param {number|string} clientId
 */
export function getClientCheckins(clientId) {
  return http.get(`/checkins/client/${clientId}`);
}

/**
 * Descarga una foto protegida usando el JWT del trainer.
 * @param {number|string} photoId
 */
export function getCheckinPhoto(photoId) {
  return http.get(`/checkins/photos/${photoId}`, { responseType: 'blob' });
}
