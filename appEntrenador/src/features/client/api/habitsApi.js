import http from '../../../shared/api/http.js';

/** @param {string} date YYYY-MM-DD local */
export function getTodayHabits(date) {
  return http.get('/habits/today', { params: { date } });
}

/** @param {number|string} habitId @param {string} date YYYY-MM-DD local */
export function toggleHabit(habitId, date) {
  return http.post(`/habits/${habitId}/toggle`, { date });
}
