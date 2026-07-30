import http from './http.js';

/**
 * GET /me/notification-settings
 * Soft-fail callers should treat 404 as "not ready yet".
 */
export function getNotificationSettings() {
  return http.get('/me/notification-settings');
}

/**
 * PUT /me/notification-settings
 * @param {{ workout_reminder_enabled?: boolean, workout_reminder_hour?: number }} payload
 */
export function updateNotificationSettings(payload) {
  return http.put('/me/notification-settings', payload);
}
