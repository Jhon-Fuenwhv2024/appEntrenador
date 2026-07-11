import http from '../../../shared/api/http.js';

export function login(credentials) {
  return http.post('/login', credentials);
}

export function registerClient(payload) {
  return http.post('/register', payload);
}

export function generateInvitation() {
  return http.post('/generate-token');
}
