import http from '../../../shared/api/http.js';

export function getClientNutrition(clientId) {
  return http.get(`/nutrition/${clientId}`);
}

export function upsertClientNutrition(clientId, payload) {
  return http.put(`/nutrition/${clientId}`, payload);
}
