import http from '../../../shared/api/http.js';

export function getClientRoutines(clientId) {
  return http.get(`/clients/${clientId}/routines`);
}

export function createClientRoutine(clientId, payload) {
  return http.post(`/clients/${clientId}/routines`, payload);
}

export function updateRoutine(routineId, payload) {
  return http.put(`/routines/${routineId}`, payload);
}

export function appendExerciseToRoutine(routineId, payload) {
  return http.post(`/routines/${routineId}/exercises`, payload);
}

export function deleteRoutine(routineId) {
  return http.delete(`/routines/${routineId}`);
}
