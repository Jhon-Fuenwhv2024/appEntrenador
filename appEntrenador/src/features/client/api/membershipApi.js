import http from '../../../shared/api/http.js';

/** Membresía del cliente autenticado (sin notes internas). */
export function getMyMembership() {
  return http.get('/me/membership');
}
