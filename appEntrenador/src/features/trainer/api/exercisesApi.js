import http from '../../../shared/api/http.js';

export function getExercises(q) {
  const params = q ? { q } : undefined;
  return http.get('/exercises', { params });
}

export function createExercise(payload) {
  return http.post('/exercises', payload);
}

export function updateExercise(id, payload) {
  return http.put(`/exercises/${id}`, payload);
}

export function deleteExercise(id) {
  return http.delete(`/exercises/${id}`);
}
