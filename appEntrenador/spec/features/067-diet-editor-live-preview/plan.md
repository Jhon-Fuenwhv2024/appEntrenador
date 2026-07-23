# 067 · Plan — Editor nutricional + preview en vivo

## Enfoque

1. Ajustar estilos de `DietPlanForm`: meal header vs food rows (jerarquía tipográfica/CSS).
2. Crear adapter `draft →` shape de `ClientDietView` (`day.meals`, macros, `weekPreview` local).
3. Extender `ClientDietView` con `previewMode` (o reforzar `skipFetch`): no fetch `/me/diet-plan/week`; aceptar preview inyectado.
4. Layout split en `DietPlanPanel` / wrapper del form: preview | editor; colapsable en móvil.
5. Wire reactivo: `activeWeek` / `activeDia` / `daysByKey` → computed `initialPlan` → preview.
6. Validar contraste, clearance bottom nav, build FE.

## Decisiones

- FE-only; sin migración DB.
- Preferir reutilizar `ClientDietView` frente a duplicar markup cliente.
- Adapter en `src/shared/nutrition/` (p. ej. `dietPlanPreviewAdapter.js`) para no acoplar el form al shape de `/me`.
- En previewMode, ids de meals/items pueden ser temporales/sintéticos.
- Breakpoint split: 960px (alineado al shell / bottom nav del proyecto).

## Archivos clave

- FE trainer: `DietPlanForm.vue`, `DietPlanPanel.vue`
- FE client: `ClientDietView.vue` (modo preview)
- Shared: `src/shared/nutrition/dietPlanPreviewAdapter.js` (o nombre equivalente), `macros.js`
- Referencia visual: estilos 057 en `ClientDietView.vue`
