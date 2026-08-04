import http from '../../../shared/api/http.js';

/** GET /api/me/diet-plan?date=YYYY-MM-DD — día resuelto del plan activo. */
export function getMyDietPlan(date) {
  const params = {};
  if (date) params.date = date;
  return http.get('/me/diet-plan', { params });
}

/** GET /api/me/diet-plan/week?date=YYYY-MM-DD — preview semana del ciclo. */
export function getMyDietPlanWeek(date) {
  const params = {};
  if (date) params.date = date;
  return http.get('/me/diet-plan/week', { params });
}

/** GET /api/me/diet-plan/shopping-list — lista de compra del plan activo (071). */
export function getMyShoppingList() {
  return http.get('/me/diet-plan/shopping-list');
}

/** PUT /api/me/diet-meals/:mealId/adherence — Comí / No comí (083). */
export function upsertMealAdherence(mealId, payload) {
  return http.put(`/me/diet-meals/${mealId}/adherence`, payload);
}
