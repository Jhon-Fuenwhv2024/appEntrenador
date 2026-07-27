/**
 * Per-100g macros for common LATAM foods (USDA-aligned approximates).
 * Used when USDA is rate-limited / unavailable and OFF is unreliable for generics.
 * Keys match `esFoodAliases` (lowercase, with accents as stored there).
 */
const STATIC_PER_100G = {
  huevo: {
    name: 'Huevo entero (crudo)',
    calories: 143,
    protein_g: 12.6,
    carbs_g: 0.7,
    fats_g: 9.5,
  },
  huevos: {
    name: 'Huevo entero (crudo)',
    calories: 143,
    protein_g: 12.6,
    carbs_g: 0.7,
    fats_g: 9.5,
  },
  'clara de huevo': {
    name: 'Clara de huevo (cruda)',
    calories: 52,
    protein_g: 10.9,
    carbs_g: 0.7,
    fats_g: 0.2,
  },
  'yema de huevo': {
    name: 'Yema de huevo (cruda)',
    calories: 322,
    protein_g: 15.9,
    carbs_g: 3.6,
    fats_g: 26.5,
  },
  pollo: {
    name: 'Pechuga de pollo (cocida)',
    calories: 165,
    protein_g: 31,
    carbs_g: 0,
    fats_g: 3.6,
  },
  'pechuga de pollo': {
    name: 'Pechuga de pollo (cocida)',
    calories: 165,
    protein_g: 31,
    carbs_g: 0,
    fats_g: 3.6,
  },
  'muslo de pollo': {
    name: 'Muslo de pollo (cocido)',
    calories: 209,
    protein_g: 26,
    carbs_g: 0,
    fats_g: 10.9,
  },
  arroz: {
    name: 'Arroz blanco (cocido)',
    calories: 130,
    protein_g: 2.7,
    carbs_g: 28.2,
    fats_g: 0.3,
  },
  'arroz integral': {
    name: 'Arroz integral (cocido)',
    calories: 123,
    protein_g: 2.7,
    carbs_g: 25.6,
    fats_g: 1,
  },
  avena: {
    name: 'Avena (cruda)',
    calories: 389,
    protein_g: 16.9,
    carbs_g: 66.3,
    fats_g: 6.9,
  },
  'avena cocida': {
    name: 'Avena cocida',
    calories: 71,
    protein_g: 2.5,
    carbs_g: 12,
    fats_g: 1.5,
  },
  platano: {
    name: 'Plátano / banana',
    calories: 89,
    protein_g: 1.1,
    carbs_g: 22.8,
    fats_g: 0.3,
  },
  plátano: {
    name: 'Plátano / banana',
    calories: 89,
    protein_g: 1.1,
    carbs_g: 22.8,
    fats_g: 0.3,
  },
  banana: {
    name: 'Plátano / banana',
    calories: 89,
    protein_g: 1.1,
    carbs_g: 22.8,
    fats_g: 0.3,
  },
  manzana: {
    name: 'Manzana',
    calories: 52,
    protein_g: 0.3,
    carbs_g: 13.8,
    fats_g: 0.2,
  },
  aguacate: {
    name: 'Aguacate',
    calories: 160,
    protein_g: 2,
    carbs_g: 8.5,
    fats_g: 14.7,
  },
  palta: {
    name: 'Aguacate',
    calories: 160,
    protein_g: 2,
    carbs_g: 8.5,
    fats_g: 14.7,
  },
  leche: {
    name: 'Leche entera',
    calories: 61,
    protein_g: 3.2,
    carbs_g: 4.8,
    fats_g: 3.3,
  },
  'yogur griego': {
    name: 'Yogur griego natural',
    calories: 97,
    protein_g: 9,
    carbs_g: 3.6,
    fats_g: 5,
  },
  'yogurt griego': {
    name: 'Yogur griego natural',
    calories: 97,
    protein_g: 9,
    carbs_g: 3.6,
    fats_g: 5,
  },
  atun: {
    name: 'Atún en agua (escurrido)',
    calories: 86,
    protein_g: 19,
    carbs_g: 0,
    fats_g: 1,
  },
  atún: {
    name: 'Atún en agua (escurrido)',
    calories: 86,
    protein_g: 19,
    carbs_g: 0,
    fats_g: 1,
  },
  salmon: {
    name: 'Salmón (cocido)',
    calories: 206,
    protein_g: 22,
    carbs_g: 0,
    fats_g: 13,
  },
  salmón: {
    name: 'Salmón (cocido)',
    calories: 206,
    protein_g: 22,
    carbs_g: 0,
    fats_g: 13,
  },
  pan: {
    name: 'Pan blanco',
    calories: 265,
    protein_g: 9,
    carbs_g: 49,
    fats_g: 3.2,
  },
  'aceite de oliva': {
    name: 'Aceite de oliva',
    calories: 884,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 100,
  },
  quinoa: {
    name: 'Quinoa (cocida)',
    calories: 120,
    protein_g: 4.4,
    carbs_g: 21.3,
    fats_g: 1.9,
  },
  lentejas: {
    name: 'Lentejas (cocidas)',
    calories: 116,
    protein_g: 9,
    carbs_g: 20,
    fats_g: 0.4,
  },
  papa: {
    name: 'Papa (hervida)',
    calories: 87,
    protein_g: 1.9,
    carbs_g: 20.1,
    fats_g: 0.1,
  },
  patata: {
    name: 'Papa (hervida)',
    calories: 87,
    protein_g: 1.9,
    carbs_g: 20.1,
    fats_g: 0.1,
  },
};

/**
 * @param {string|null} aliasKey
 * @returns {{ id: string, name: string, source: string, per_100g: object }|null}
 */
function getStaticFoodHit(aliasKey) {
  if (!aliasKey) return null;
  const raw = STATIC_PER_100G[aliasKey];
  if (!raw) {
    const normalized = String(aliasKey)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const found = STATIC_PER_100G[normalized];
    if (!found) return null;
    return {
      id: `static:${normalized}`,
      name: found.name,
      source: 'static',
      per_100g: {
        calories: found.calories,
        protein_g: found.protein_g,
        carbs_g: found.carbs_g,
        fats_g: found.fats_g,
      },
    };
  }
  return {
    id: `static:${aliasKey}`,
    name: raw.name,
    source: 'static',
    per_100g: {
      calories: raw.calories,
      protein_g: raw.protein_g,
      carbs_g: raw.carbs_g,
      fats_g: raw.fats_g,
    },
  };
}

module.exports = {
  STATIC_PER_100G,
  getStaticFoodHit,
};
