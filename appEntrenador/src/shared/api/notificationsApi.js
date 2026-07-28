import http from './http.js';

export function getNotifications() {
  return http.get('/notifications');
}

export function markNotificationAsRead(id) {
  return http.put(`/notifications/${id}/read`);
}

export function markAllNotificationsAsRead() {
  return http.put('/notifications/read-all');
}

export function deleteNotification(id) {
  return http.delete(`/notifications/${id}`);
}
