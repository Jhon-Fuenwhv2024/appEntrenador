import http from './http.js';

/**
 * Evolución corporal (peso + IMC) para gráficas.
 * @param {number|string} clientId
 */
export function getProgressMetrics(clientId) {
  return http.get(`/progress/metrics/${clientId}`);
}

/**
 * Lista ejercicios con logs, o serie de fuerza si se pasa exerciseId/exerciseName.
 * @param {number|string} clientId
 * @param {{ exerciseId?: number|string, exerciseName?: string }} [params]
 */
export function getProgressExercises(clientId, params = {}) {
  const query = {};
  if (params.exerciseId != null && params.exerciseId !== '') {
    query.exerciseId = params.exerciseId;
  }
  if (params.exerciseName) {
    query.exerciseName = params.exerciseName;
  }
  return http.get(`/progress/exercises/${clientId}`, { params: query });
}
