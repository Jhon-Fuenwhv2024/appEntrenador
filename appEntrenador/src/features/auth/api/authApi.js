import http from '../../../shared/api/http.js';

export function login(credentials) {
  return http.post('/login', credentials);
}

export function registerClient(payload) {
  return http.post('/register', payload);
}

/** Prefer features/trainer/api/invitationsApi.createInvite (Feature 023). */
export function generateInvitation() {
  return http.post('/invites');
}
