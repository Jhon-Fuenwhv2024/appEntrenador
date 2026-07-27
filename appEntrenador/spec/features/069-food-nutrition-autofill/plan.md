# 069 · Plan técnico

## Enfoque

Proxy autenticado en Express que consulta USDA (genéricos) y Open Food Facts (español/empaquetados). El frontend solo llama a Trainfit API; no ve keys externas.

## Módulos

| Capa | Path |
|------|------|
| Routes | `backend/src/modules/food-lookup/food-lookup.routes.js` |
| Controller | `food-lookup.controller.js` |
| Service | `food-lookup.service.js` |
| Providers | `providers/usdaFoodData.js`, `providers/openFoodFacts.js` |
| Aliases | `aliases/esFoodAliases.js` |
| FE API | `src/features/trainer/api/foodLookupApi.js` |
| UI | `DietPlanForm.vue` |

## Env

`USDA_FDC_API_KEY` — key gratuita api.data.gov. Sin key: solo OFF.

## Escalado

`scaled = per_100g * (quantity / 100)` cuando `unit` ∈ {`g`,`ml`}. Otras unidades: servir serving del proveedor si existe; si no, devolver `per_100g` sin escalar inventado y mensaje suave.
