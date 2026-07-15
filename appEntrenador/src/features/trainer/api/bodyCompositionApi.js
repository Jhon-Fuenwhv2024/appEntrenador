import http from '../../../shared/api/http.js';

export function getClientBodyComposition(clientId) {
  return http.get(`/clients/${clientId}/body-composition`);
}

export function createClientBodyComposition(clientId, payload) {
  return http.post(`/clients/${clientId}/body-composition`, payload);
}

export function updateClientBodyComposition(clientId, logId, payload) {
  return http.put(`/clients/${clientId}/body-composition/${logId}`, payload);
}
