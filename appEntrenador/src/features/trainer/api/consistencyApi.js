import http from '../../../shared/api/http.js';

export function getClientConsistency(clientId) {
  return http.get(`/clients/${clientId}/consistency`);
}

export function updateClientWeekGoal(clientId, weekGoal) {
  return http.put(`/clients/${clientId}/consistency`, { week_goal: weekGoal });
}
