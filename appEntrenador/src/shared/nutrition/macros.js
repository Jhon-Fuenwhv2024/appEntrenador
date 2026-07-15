/**
 * Factores Atwater generales (FDA 21 CFR 101.9 / USDA Handbook 74):
 * proteína 4 kcal/g, carbohidratos 4 kcal/g, grasas 9 kcal/g.
 * https://www.law.cornell.edu/cfr/text/21/101.9
 */
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARBS = 4;
export const KCAL_PER_G_FAT = 9;

/**
 * Energía estimada (kcal) desde macros en gramos.
 * Redondea al entero más cercano (etiquetado nutricional).
 */
export function caloriesFromMacros(proteinG, carbsG, fatsG) {
  const protein = Number(proteinG) || 0;
  const carbs = Number(carbsG) || 0;
  const fats = Number(fatsG) || 0;
  return Math.round(
    protein * KCAL_PER_G_PROTEIN
    + carbs * KCAL_PER_G_CARBS
    + fats * KCAL_PER_G_FAT,
  );
}

/** Coerce a entero positivo (>= 1). null si inválido. */
export function toPositiveInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Math.round(Number(value));
  if (!Number.isFinite(num) || num < 1) return null;
  return num;
}
