import http from '../../../shared/api/http.js';

/**
 * Crea un check-in semanal (multipart). Campos: sleep_quality, stress_level,
 * diet_adherence, notes?, created_at?. Archivos opcionales: front, side, back.
 * @param {FormData} formData
 */
export function createCheckin(formData) {
  return http.post('/checkins', formData);
}

/**
 * Historial de check-ins + fotos de un cliente.
 * @param {number|string} clientId
 */
export function getClientCheckins(clientId) {
  return http.get(`/checkins/client/${clientId}`);
}
