const axios = require('axios');
const { USDA_FDC_API_KEY } = require('../../../config/env');

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

/** USDA FoodData Central nutrient numbers */
const NUTRIENT = {
  energyKcal: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
};

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function extractPer100g(food) {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  /** @type {Map<number, number>} FDC nutrientId → amount */
  const byId = new Map();

  for (const n of nutrients) {
    const id = Number(n.nutrientId ?? n.nutrient?.id);
    const amount = Number(n.value ?? n.amount ?? n.nutrientAmount);
    if (Number.isFinite(id) && Number.isFinite(amount)) {
      byId.set(id, amount);
      continue;
    }
    // Legacy nutrientNumber (e.g. "203") is unreliable; skip unless already mapped by id.
  }

  // Detail endpoint nests nutrient under .nutrient
  if (byId.size === 0) {
    for (const n of nutrients) {
      const id = Number(n.nutrient?.id ?? n.nutrientId);
      const amount = Number(n.amount ?? n.value);
      if (Number.isFinite(id) && Number.isFinite(amount)) {
        byId.set(id, amount);
      }
    }
  }

  const calories = byId.get(NUTRIENT.energyKcal);
  const protein_g = byId.get(NUTRIENT.protein);
  const fats_g = byId.get(NUTRIENT.fat);
  const carbs_g = byId.get(NUTRIENT.carbs);

  if (
    calories == null
    && protein_g == null
    && fats_g == null
    && carbs_g == null
  ) {
    return null;
  }

  return {
    calories: round2(calories || 0),
    protein_g: round2(protein_g || 0),
    carbs_g: round2(carbs_g || 0),
    fats_g: round2(fats_g || 0),
  };
}

function mapSearchHit(food) {
  const per100g = extractPer100g(food);
  if (!per100g) return null;
  return {
    id: `usda:${food.fdcId}`,
    fdcId: food.fdcId,
    name: food.description || food.lowercaseDescription || 'USDA food',
    source: 'usda',
    per_100g: per100g,
  };
}

/**
 * @param {string} query
 * @param {{ pageSize?: number }} [opts]
 * @returns {Promise<Array>}
 */
async function searchUsda(query, opts = {}) {
  const apiKey = USDA_FDC_API_KEY;
  if (!apiKey) {
    return [];
  }

  const pageSize = Math.min(Number(opts.pageSize) || 8, 25);
  const q = String(query || '').trim();
  if (!q) return [];

  try {
    const { data } = await axios.post(
      `${USDA_BASE}/foods/search`,
      {
        query: q,
        pageSize,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
        pageNumber: 1,
      },
      {
        params: { api_key: apiKey },
        timeout: 12000,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const foods = Array.isArray(data?.foods) ? data.foods : [];
    return foods.map(mapSearchHit).filter(Boolean);
  } catch (error) {
    console.error('[food-lookup/usda] search failed:', error.message);
    return [];
  }
}

/**
 * Fetch a single food by FDC id (richer nutrients when needed).
 * @param {number|string} fdcId
 */
async function getUsdaFood(fdcId) {
  const apiKey = USDA_FDC_API_KEY;
  if (!apiKey || !fdcId) return null;

  try {
    const { data } = await axios.get(`${USDA_BASE}/food/${fdcId}`, {
      params: { api_key: apiKey },
      timeout: 12000,
    });
    const mapped = mapSearchHit(data);
    return mapped;
  } catch (error) {
    console.error('[food-lookup/usda] get food failed:', error.message);
    return null;
  }
}

module.exports = {
  searchUsda,
  getUsdaFood,
  extractPer100g,
};
