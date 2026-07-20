import http from '../../../shared/api/http.js';

export function login(credentials) {
  return http.post('/login', credentials);
}

export function registerClient(payload) {
  return http.post('/register', payload);
}

/**
 * @param {{ username?: string, email?: string }} payload
 */
export function forgotPassword(payload) {
  return http.post('/auth/forgot-password', payload);
}

export function resetPassword({ token, password }) {
  return http.post('/auth/reset-password', { token, password });
}

/** Prefer features/trainer/api/invitationsApi.createInvite (Feature 023). */
export function generateInvitation() {
  return http.post('/invites');
}
