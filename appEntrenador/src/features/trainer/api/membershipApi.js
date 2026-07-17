import http from '../../../shared/api/http.js';

export function getClientMembership(clientId) {
  return http.get(`/clients/${clientId}/membership`);
}

export function upsertClientMembership(clientId, payload) {
  return http.put(`/clients/${clientId}/membership`, payload);
}
