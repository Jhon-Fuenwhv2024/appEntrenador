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

/** Unread DM summary for badge + trainer inbox (Feature 073). */
export function getUnreadSummary() {
  return http.get('/messages/unread-summary');
}

/** True partner presence (open SSE connection). */
export function getPartnerPresence(partnerId) {
  return http.get(`/messages/presence/${partnerId}`);
}

export function getConversation(partnerId) {
  return http.get(`/messages/${partnerId}`);
}

export function sendMessage({ receiverId, content }) {
  return http.post('/messages', { receiverId, content });
}
