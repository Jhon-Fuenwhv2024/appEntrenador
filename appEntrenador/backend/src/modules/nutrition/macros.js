/**
 * Factores Atwater generales (FDA 21 CFR 101.9 / USDA Handbook 74):
 * proteína 4 kcal/g, carbohidratos 4 kcal/g, grasas 9 kcal/g.
 */
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

function caloriesFromMacros(proteinG, carbsG, fatsG) {
  return Math.round(
    Number(proteinG) * KCAL_PER_G_PROTEIN
    + Number(carbsG) * KCAL_PER_G_CARBS
    + Number(fatsG) * KCAL_PER_G_FAT,
  );
}

module.exports = {
  KCAL_PER_G_PROTEIN,
  KCAL_PER_G_CARBS,
  KCAL_PER_G_FAT,
  caloriesFromMacros,
};
