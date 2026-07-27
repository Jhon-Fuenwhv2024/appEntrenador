# 069 · Autocompletado nutricional de alimentos (trainer)

**Estado:** implementado  
**Depende de:** 043 (diet plans), 064 (ciclo multi-semana)  
**Relacionada:** 067 (editor preview; fuera de alcance catálogo)

## Qué hace

Cuando el entrenador escribe un alimento en el editor de dieta (ej. “Huevo”), el sistema consulta bases nutricionales por internet (proxy autenticado) y **rellena automáticamente** kcal, proteína, carbohidratos y grasa según la cantidad/unidad actual.

## Criterios de aceptación

### Backend

- [x] `GET /api/trainer/foods/lookup?q=&quantity=&unit=` — trainer autenticado
- [x] `GET /api/trainer/foods/search?q=` — hasta 8 sugerencias para autocomplete
- [x] Proveedor primario: USDA FoodData Central (`USDA_FDC_API_KEY`)
- [x] Fallback: Open Food Facts (sin key)
- [x] Alias ES→EN para alimentos comunes LATAM
- [x] Macros base por 100 g/ml; escalado a `quantity` si unidad es `g`/`ml`
- [x] API key solo en backend; respuestas JSON unificadas
- [x] Route → Controller → Service (sin lógica en routes)

### Frontend

- [x] En `DietPlanForm`: autocomplete free-solo + blur/debounce autofill si macros están en 0
- [x] Botón “Autocompletar” (icono) para forzar refill
- [x] Reescalado al cambiar cantidad/unidad `g`/`ml` si hay `per_100g` del autofill
- [x] Trainer puede editar macros a mano; no pisar valores no-cero en blur
- [x] Contraste / `tf-overlay-menu` / `aria-label` en botón icono

## Fuera de alcance

- Catálogo propio en DB / barcodes
- Registro diario de comida (053)
- Conversión inventada para `unidad`/`taza` sin serving del proveedor
- Preview split del editor (067)
