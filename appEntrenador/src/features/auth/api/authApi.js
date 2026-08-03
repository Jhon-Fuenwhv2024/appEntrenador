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

/** Feature 083: renovar access + refresh (también usado vía interceptor). */
export function refreshSession(refreshToken) {
  return http.post('/auth/refresh', { refreshToken });
}

/** Feature 083: revoca refresh en servidor. */
export function logoutSession(payload = {}) {
  return http.post('/auth/logout', payload);
}

/** Prefer features/trainer/api/invitationsApi.createInvite (Feature 023). */
export function generateInvitation() {
  return http.post('/invites');
}
