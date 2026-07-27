import http from '../../../shared/api/http.js';

/**
 * GET /api/trainer/foods/search?q=
 * @param {string} q
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export function searchFoods(q) {
  return http.get('/trainer/foods/search', {
    params: { q },
  });
}

/**
 * GET /api/trainer/foods/lookup?q=&quantity=&unit=&fdcId=
 * @param {{ q: string, quantity?: number, unit?: string, fdcId?: string|number }} params
 */
export function lookupFood(params) {
  const { q, quantity, unit, fdcId } = params || {};
  const query = { q };
  if (quantity != null && quantity !== '') query.quantity = quantity;
  if (unit) query.unit = unit;
  if (fdcId != null && fdcId !== '') {
    const raw = String(fdcId);
    const numeric = raw.startsWith('usda:') ? raw.slice(5) : raw;
    if (/^\d+$/.test(numeric)) query.fdcId = numeric;
  }
  return http.get('/trainer/foods/lookup', { params: query });
}
