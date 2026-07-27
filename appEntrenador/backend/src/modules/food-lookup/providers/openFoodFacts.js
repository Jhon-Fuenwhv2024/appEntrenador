const axios = require('axios');

const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';
const USER_AGENT = 'Trainfit/1.0 (food-nutrition-lookup; contact@trainfit.local)';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function nutrimentsToPer100g(nutriments) {
  if (!nutriments || typeof nutriments !== 'object') return null;

  const calories = Number(
    nutriments['energy-kcal_100g']
    ?? nutriments.energy_kcal_100g
    ?? (nutriments.energy_100g != null ? Number(nutriments.energy_100g) / 4.184 : null),
  );
  const protein_g = Number(nutriments.proteins_100g);
  const carbs_g = Number(nutriments.carbohydrates_100g);
  const fats_g = Number(nutriments.fat_100g);

  const hasAny = [calories, protein_g, carbs_g, fats_g].some(
    (v) => Number.isFinite(v) && v > 0,
  );
  if (!hasAny) return null;

  return {
    calories: round2(Number.isFinite(calories) ? calories : 0),
    protein_g: round2(Number.isFinite(protein_g) ? protein_g : 0),
    carbs_g: round2(Number.isFinite(carbs_g) ? carbs_g : 0),
    fats_g: round2(Number.isFinite(fats_g) ? fats_g : 0),
  };
}

function productDisplayName(product) {
  const name = product.product_name_es
    || product.product_name
    || product.generic_name_es
    || product.generic_name
    || '';
  const brand = product.brands ? String(product.brands).split(',')[0].trim() : '';
  if (name && brand) return `${name} (${brand})`;
  return name || brand || 'Producto OFF';
}

/**
 * @param {string} query
 * @param {{ pageSize?: number }} [opts]
 */
async function searchOpenFoodFacts(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const pageSize = Math.min(Number(opts.pageSize) || 8, 20);

  try {
    const { data } = await axios.get(OFF_SEARCH, {
      params: {
        search_terms: q,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: pageSize,
        fields: 'code,product_name,product_name_es,generic_name,generic_name_es,brands,nutriments',
      },
      timeout: 12000,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    const products = Array.isArray(data?.products) ? data.products : [];
    const results = [];

    for (const product of products) {
      const per100g = nutrimentsToPer100g(product.nutriments);
      if (!per100g) continue;
      results.push({
        id: `off:${product.code || results.length}`,
        name: productDisplayName(product),
        source: 'open_food_facts',
        per_100g: per100g,
      });
    }

    return results;
  } catch (error) {
    console.error('[food-lookup/off] search failed:', error.message);
    return [];
  }
}

module.exports = {
  searchOpenFoodFacts,
  nutrimentsToPer100g,
};
