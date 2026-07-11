import http from '../../../shared/api/http.js';

export function getClients() {
  return http.get('/clients');
}
