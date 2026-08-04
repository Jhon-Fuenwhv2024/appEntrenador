# 084 · Plan — Preview en vivo del builder de rutinas

## Enfoque

1. Specs SDD (`spec` / `plan` / `tasks`).
2. Adapter `draft + catálogo →` shape de preview con media.
3. Componente presentacional `RoutineDayPreview` (look de 058, sin fetch ni CTA Empezar).
4. Layout split en `Client360Programming` al abrir el builder; preview colapsable en móvil.
5. Media compacta en filas de `RoutineDayBuilder` (prop `compact` en `WorkoutExerciseMedia` si hace falta).
6. Validar contraste, clearance bottom nav, `npm run build`.

## Decisiones

- FE-only; sin migración DB ni cambios de API.
- Catálogo del combobox: mantener política Fitcron (`enriched` + media local).
- Adapter en `src/shared/routines/routineDraftPreviewAdapter.js`.
- Breakpoint split: 960px (shell / bottom nav).
- Preferir reutilizar `WorkoutExerciseMedia` frente a duplicar players.

## Archivos clave

- FE: `Client360Programming.vue`, `RoutineDayBuilder.vue`, `RoutineDayPreview.vue` (nuevo)
- Shared: `routineDraftPreviewAdapter.js`, `exerciseDisplay.js`
- Media: `WorkoutExerciseMedia.vue`
- Docs: actualizar flujo de Programación en `docs/` si existe sección relevante
