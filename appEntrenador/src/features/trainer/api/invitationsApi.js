import http from '../../../shared/api/http.js';

export function createInvite() {
  return http.post('/invites');
}

export function listInvites() {
  return http.get('/invites');
}

export function revokeInvite(id) {
  return http.patch(`/invites/${id}/revoke`);
}

/** @deprecated Prefer createInvite(); kept for dashboard callers. */
export function generateInvitationLink() {
  return createInvite();
}
