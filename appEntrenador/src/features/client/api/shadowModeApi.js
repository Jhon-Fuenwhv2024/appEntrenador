import http from '../../../shared/api/http.js';

/** @returns {Promise<import('axios').AxiosResponse>} */
export function patchWorkoutLive(payload) {
  return http.patch('/me/workout-live', payload);
}

export function clearWorkoutLive() {
  return http.delete('/me/workout-live');
}

export function getShadowModeSettings() {
  return http.get('/me/settings/shadow-mode');
}

export function patchShadowModeSettings(payload) {
  return http.patch('/me/settings/shadow-mode', payload);
}
