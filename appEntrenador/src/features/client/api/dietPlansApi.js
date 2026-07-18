import http from '../../../shared/api/http.js';

/** GET /api/me/diet-plan — plan activo del cliente autenticado (o null). */
export function getMyDietPlan() {
  return http.get('/me/diet-plan');
}
