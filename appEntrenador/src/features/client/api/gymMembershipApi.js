import http from '../../../shared/api/http.js';

/** GET /api/me/gym-membership — membresía del gym físico (Feature 082). */
export function getMyGymMembership() {
  return http.get('/me/gym-membership');
}

/** PUT /api/me/gym-membership */
export function upsertMyGymMembership(payload) {
  return http.put('/me/gym-membership', payload);
}

/** DELETE /api/me/gym-membership */
export function deleteMyGymMembership() {
  return http.delete('/me/gym-membership');
}
