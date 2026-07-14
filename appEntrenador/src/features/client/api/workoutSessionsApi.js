import http from '../../../shared/api/http.js';

export function createMyWorkoutSession(payload) {
  return http.post('/me/workout-sessions', payload);
}

export function getMyWorkoutSessions() {
  return http.get('/me/workout-sessions');
}
