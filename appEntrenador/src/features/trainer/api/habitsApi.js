import http from '../../../shared/api/http.js';

export function getClientHabits(clientId) {
  return http.get(`/habits/client/${clientId}`);
}

export function createClientHabit(clientId, title) {
  return http.post(`/habits/client/${clientId}`, { title });
}

export function deleteHabit(habitId) {
  return http.delete(`/habits/${habitId}`);
}
