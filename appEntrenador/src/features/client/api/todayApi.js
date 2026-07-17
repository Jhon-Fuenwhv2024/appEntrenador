import http from '../../../shared/api/http.js';

/**
 * Feature 038 — resumen del día del cliente (una petición).
 * @param {string} date YYYY-MM-DD (fecha civil local)
 */
export function getMyToday(date) {
  return http.get('/me/today', { params: { date } });
}
