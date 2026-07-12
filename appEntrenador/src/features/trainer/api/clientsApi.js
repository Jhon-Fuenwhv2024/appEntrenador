import http from '../../../shared/api/http.js';

export function getClients() {
  return http.get('/clients');
}

export function getClientById(clientId) {
  return http.get(`/clients/${clientId}`);
}
