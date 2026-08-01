import http from '../../../shared/api/http.js';

/** @param {string} date YYYY-MM-DD local */
export function getTodayHabits(date) {
  return http.get('/habits/today', { params: { date } });
}

/**
 * @param {number|string} habitId
 * @param {string} date YYYY-MM-DD local
 * @param {boolean} [completed] estado deseado (si se omite, el backend hace toggle)
 */
export function toggleHabit(habitId, date, completed) {
  const body = { date };
  if (typeof completed === 'boolean') {
    body.completed = completed;
  }
  return http.post(`/habits/${habitId}/toggle`, body);
}
