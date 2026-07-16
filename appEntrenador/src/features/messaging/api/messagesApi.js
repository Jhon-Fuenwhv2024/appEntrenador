import http, { API_ORIGIN } from '../../../shared/api/http.js';
import { getAuthToken } from '../../../shared/auth/session.js';

/**
 * Build SSE URL with JWT query param (EventSource cannot set Authorization).
 */
export function getMessagesStreamUrl() {
  const token = getAuthToken();
  const base = `${API_ORIGIN}/api/messages/stream`;
  if (!token) return base;
  return `${base}?token=${encodeURIComponent(token)}`;
}

/** Client: assigned trainer as chat partner. */
export function getChatPartner() {
  return http.get('/messages/partner');
}

export function getConversation(partnerId) {
  return http.get(`/messages/${partnerId}`);
}

export function sendMessage({ receiverId, content }) {
  return http.post('/messages', { receiverId, content });
}
