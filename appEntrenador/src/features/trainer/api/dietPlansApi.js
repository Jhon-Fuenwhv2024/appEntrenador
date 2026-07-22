import http from '../../../shared/api/http.js';

/** GET /api/trainer/diets?clientId= */
export function listDietPlans(clientId) {
  const params = {};
  if (clientId != null && clientId !== '') {
    params.clientId = clientId;
  }
  return http.get('/trainer/diets', { params });
}

/** GET /api/trainer/diets/:id */
export function getDietPlan(planId) {
  return http.get(`/trainer/diets/${planId}`);
}

/** POST /api/trainer/diets */
export function createDietPlan(payload) {
  return http.post('/trainer/diets', payload);
}

/** PUT /api/trainer/diets/:id */
export function updateDietPlan(planId, payload) {
  return http.put(`/trainer/diets/${planId}`, payload);
}

/** DELETE /api/trainer/diets/:id */
export function deleteDietPlan(planId) {
  return http.delete(`/trainer/diets/${planId}`);
}

/** POST /api/trainer/diets/:id/activate */
export function activateDietPlan(planId) {
  return http.post(`/trainer/diets/${planId}/activate`);
}

/** POST /api/trainer/diets/:id/copy-day */
export function copyDietDay(planId, payload) {
  return http.post(`/trainer/diets/${planId}/copy-day`, payload);
}

/** POST /api/trainer/diets/:id/copy-week */
export function copyDietWeek(planId, payload) {
  return http.post(`/trainer/diets/${planId}/copy-week`, payload);
}
