import http from '../../../shared/api/http.js';

export function listTrainers() {
  return http.get('/saas/trainers');
}

export function updateTrainerPlan(id, payload) {
  return http.put(`/saas/trainers/${id}/plan`, payload);
}
