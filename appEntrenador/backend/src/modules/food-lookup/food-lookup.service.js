const { resolveFoodAlias } = require('./aliases/esFoodAliases');
const { getStaticFoodHit } = require('./aliases/staticNutrition');
const { searchUsda, getUsdaFood } = require('./providers/usdaFoodData');
const { searchOpenFoodFacts } = require('./providers/openFoodFacts');
const { USDA_FDC_API_KEY } = require('../../config/env');

const CACHE_TTL_MS = 8 * 60 * 1000;
const cache = new Map();

const SCALE_UNITS = new Set(['g', 'ml']);
const ALLOWED_UNITS = new Set(['g', 'ml', 'unidad', 'taza', 'cucharada', 'porción']);

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function normalizeCacheKey(parts) {
  return parts.map((p) => String(p || '').trim().toLowerCase()).join('|');
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function scaleMacros(per100g, quantity, unit) {
  const qty = Number(quantity);
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 100;
  const u = ALLOWED_UNITS.has(unit) ? unit : 'g';

  if (SCALE_UNITS.has(u)) {
    const factor = safeQty / 100;
    return {
      quantity: safeQty,
      unit: u,
      calories: round2(per100g.calories * factor),
      protein_g: round2(per100g.protein_g * factor),
      carbs_g: round2(per100g.carbs_g * factor),
      fats_g: round2(per100g.fats_g * factor),
      scaled: true,
      note: null,
    };
  }

  return {
    quantity: safeQty,
    unit: u,
    calories: round2(per100g.calories),
    protein_g: round2(per100g.protein_g),
    carbs_g: round2(per100g.carbs_g),
    fats_g: round2(per100g.fats_g),
    scaled: false,
    note: 'Macros por 100 g de referencia; ajusta cantidad/unidad o edita a mano.',
  };
}

function buildResult(query, hit, quantity, unit) {
  const scaled = scaleMacros(hit.per_100g, quantity, unit);
  return {
    query: String(query || '').trim(),
    matched_name: hit.name,
    quantity: scaled.quantity,
    unit: scaled.unit,
    calories: scaled.calories,
    protein_g: scaled.protein_g,
    carbs_g: scaled.carbs_g,
    fats_g: scaled.fats_g,
    per_100g: { ...hit.per_100g },
    source: hit.source,
    scaled: scaled.scaled,
    note: scaled.note,
    suggestion_id: hit.id || null,
  };
}

/**
 * Search suggestions for autocomplete (static + USDA + OFF).
 * @param {string} q
 */
async function searchFoods(q) {
  const query = String(q || '').trim();
  if (query.length < 2) {
    return [];
  }

  const cacheKey = normalizeCacheKey(['search', query]);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { searchQuery, aliasUsed } = resolveFoodAlias(query);
  const usdaQuery = aliasUsed ? searchQuery : query;

  const merged = [];
  const seen = new Set();

  const staticHit = getStaticFoodHit(aliasUsed);
  if (staticHit) {
    seen.add(`static:${staticHit.name}`.toLowerCase());
    merged.push({
      id: staticHit.id,
      name: staticHit.name,
      source: staticHit.source,
      per_100g: staticHit.per_100g,
    });
  }

  const [usdaHits, offHits] = await Promise.all([
    searchUsda(usdaQuery, { pageSize: 6 }),
    // Prefer English alias for OFF to avoid bad Spanish product matches (e.g. Huevo → cheese)
    searchOpenFoodFacts(aliasUsed ? searchQuery : query, { pageSize: 6 }),
  ]);

  for (const hit of [...usdaHits, ...offHits]) {
    const key = `${hit.source}:${hit.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      id: hit.id,
      name: hit.name,
      source: hit.source,
      per_100g: hit.per_100g,
    });
    if (merged.length >= 8) break;
  }

  setCached(cacheKey, merged);
  return merged;
}

/**
 * Full lookup with scaled macros.
 * @param {{ q: string, quantity?: number|string, unit?: string, fdcId?: string|number }} params
 */
async function lookupFood(params) {
  const query = String(params.q || '').trim();
  if (query.length < 2) {
    const err = new Error('Escribe al menos 2 caracteres para buscar el alimento.');
    err.code = 400;
    err.error = 'INVALID_QUERY';
    throw err;
  }

  const quantity = params.quantity != null ? Number(params.quantity) : 100;
  const unit = String(params.unit || 'g').trim().toLowerCase() || 'g';

  const cacheKey = normalizeCacheKey(['lookup', query, quantity, unit, params.fdcId]);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (params.fdcId) {
    const food = await getUsdaFood(params.fdcId);
    if (food) {
      const result = buildResult(query, food, quantity, unit);
      setCached(cacheKey, result);
      return result;
    }
  }

  const { searchQuery, aliasUsed } = resolveFoodAlias(query);
  const usdaQuery = aliasUsed ? searchQuery : query;

  let hit = null;

  if (USDA_FDC_API_KEY) {
    const usdaHits = await searchUsda(usdaQuery, { pageSize: 5 });
    hit = usdaHits[0] || null;
    if (hit?.fdcId) {
      const detailed = await getUsdaFood(hit.fdcId);
      if (detailed) hit = detailed;
    }
  }

  // Local fallback for common foods when USDA is down / rate-limited (DEMO_KEY → 429)
  if (!hit && aliasUsed) {
    hit = getStaticFoodHit(aliasUsed);
  }

  // OFF only with English alias when we have one (Spanish "Huevo" matches packaged junk)
  if (!hit && aliasUsed) {
    const offEn = await searchOpenFoodFacts(searchQuery, { pageSize: 5 });
    hit = offEn[0] || null;
  }

  if (!hit && !aliasUsed) {
    const offHits = await searchOpenFoodFacts(query, { pageSize: 5 });
    hit = offHits[0] || null;
  }

  if (!hit) {
    const err = new Error(
      `No se encontraron datos nutricionales para “${query}”. Prueba otro nombre o rellena a mano.`,
    );
    // 422 = food not found (not a missing Express route)
    err.code = 422;
    err.error = 'FOOD_NOT_FOUND';
    throw err;
  }

  const result = buildResult(query, hit, quantity, unit);
  if (hit.source === 'static') {
    result.note = result.note
      || 'Valores de referencia locales (USDA no disponible o con límite de uso).';
  }
  setCached(cacheKey, result);
  return result;
}

module.exports = {
  searchFoods,
  lookupFood,
  scaleMacros,
};
