/**
 * Spanish (LATAM) common food names → USDA-friendly English search queries.
 * Keys must be lowercase, accent-stripped where possible; lookup normalizes input.
 */
const ES_FOOD_ALIASES = {
  huevo: 'egg whole raw',
  huevos: 'egg whole raw',
  'clara de huevo': 'egg white raw',
  'yema de huevo': 'egg yolk raw',
  pollo: 'chicken breast cooked',
  'pechuga de pollo': 'chicken breast cooked',
  'muslo de pollo': 'chicken thigh cooked',
  pavo: 'turkey breast cooked',
  carne: 'beef ground cooked',
  res: 'beef ground cooked',
  'carne de res': 'beef ground cooked',
  cerdo: 'pork loin cooked',
  'lomo de cerdo': 'pork loin cooked',
  pescado: 'fish cooked',
  salmon: 'salmon cooked',
  salmón: 'salmon cooked',
  atun: 'tuna canned in water',
  atún: 'tuna canned in water',
  tilapia: 'tilapia cooked',
  arroz: 'rice white cooked',
  'arroz integral': 'rice brown cooked',
  avena: 'oats raw',
  'avena cocida': 'oatmeal cooked',
  quinoa: 'quinoa cooked',
  pasta: 'pasta cooked',
  'pan integral': 'bread whole wheat',
  pan: 'bread white',
  tortilla: 'corn tortilla',
  'tortilla de maiz': 'corn tortilla',
  'tortilla de maíz': 'corn tortilla',
  'tortilla de trigo': 'flour tortilla',
  platano: 'banana raw',
  plátano: 'banana raw',
  banana: 'banana raw',
  manzana: 'apple raw',
  naranja: 'orange raw',
  fresa: 'strawberries raw',
  fresas: 'strawberries raw',
  aguacate: 'avocado raw',
  palta: 'avocado raw',
  tomate: 'tomato raw',
  lechuga: 'lettuce raw',
  espinaca: 'spinach raw',
  brocoli: 'broccoli raw',
  brócoli: 'broccoli raw',
  zanahoria: 'carrot raw',
  papa: 'potato boiled',
  patata: 'potato boiled',
  'camote': 'sweet potato cooked',
  batata: 'sweet potato cooked',
  frijol: 'beans black cooked',
  frijoles: 'beans black cooked',
  lentejas: 'lentils cooked',
  garbanzos: 'chickpeas cooked',
  leche: 'milk whole',
  'leche descremada': 'milk skim',
  'leche desnatada': 'milk skim',
  yogurt: 'yogurt plain',
  yogur: 'yogurt plain',
  'yogurt griego': 'yogurt greek plain',
  'yogur griego': 'yogurt greek plain',
  queso: 'cheese cheddar',
  'queso fresco': 'cheese cottage',
  cottage: 'cheese cottage',
  'aceite de oliva': 'olive oil',
  aceite: 'olive oil',
  mantequilla: 'butter',
  almendra: 'almonds',
  almendras: 'almonds',
  nuez: 'walnuts',
  nueces: 'walnuts',
  cacahuate: 'peanuts',
  maní: 'peanuts',
  mani: 'peanuts',
  'mantequilla de mani': 'peanut butter',
  'mantequilla de maní': 'peanut butter',
  'mantequilla de cacahuate': 'peanut butter',
  miel: 'honey',
  azucar: 'sugar',
  azúcar: 'sugar',
  cafe: 'coffee brewed',
  café: 'coffee brewed',
  'clara': 'egg white raw',
  'proteina whey': 'whey protein powder',
  'proteína whey': 'whey protein powder',
  whey: 'whey protein powder',
  'clara liquida': 'egg white liquid',
  'clara líquida': 'egg white liquid',
};

/**
 * Resolve Spanish query to English USDA search term when alias matches.
 * @param {string} query
 * @returns {{ searchQuery: string, aliasUsed: string|null }}
 */
function resolveFoodAlias(query) {
  const raw = String(query || '').trim().toLowerCase();
  if (!raw) {
    return { searchQuery: '', aliasUsed: null };
  }

  const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (ES_FOOD_ALIASES[raw]) {
    return { searchQuery: ES_FOOD_ALIASES[raw], aliasUsed: raw };
  }
  if (ES_FOOD_ALIASES[normalized]) {
    return { searchQuery: ES_FOOD_ALIASES[normalized], aliasUsed: normalized };
  }

  // Longest prefix / contains match for phrases like "huevo cocido"
  let bestKey = null;
  for (const key of Object.keys(ES_FOOD_ALIASES)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(keyNorm) || raw.includes(key)) {
      if (!bestKey || key.length > bestKey.length) {
        bestKey = key;
      }
    }
  }
  if (bestKey) {
    return { searchQuery: ES_FOOD_ALIASES[bestKey], aliasUsed: bestKey };
  }

  return { searchQuery: raw, aliasUsed: null };
}

module.exports = {
  ES_FOOD_ALIASES,
  resolveFoodAlias,
};
