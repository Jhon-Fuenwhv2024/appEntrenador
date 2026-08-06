# Performance / Web Vitals (Feature 089)

**ADR:** [ADR-0012](decisions/ADR-0012-web-vitals-performance.md)  
**Spec:** [089-web-vitals-performance](../spec/features/089-web-vitals-performance/spec.md)

Guía operativa para mantener mejoras de velocidad sin regresiones funcionales.

## Auditoría FASE 0 (pre-cambio)

| # | Cuello | Evidencia |
|---|--------|-----------|
| 1 | Bundle sin code-splitting | `src/router.js` — 18 imports estáticos; `Dashboard.vue` importa trainer + client |
| 2 | Catálogo full + DOM | `getAllExercises` → `ref([])` → `v-autocomplete :items` (~900) |
| 3 | Payloads list gordos | `EXERCISE_SELECT_COLS` con description*; `listDietPlans` + `loadDaysWithMeals` siempre |

## Optimizaciones aplicadas

| Área | Cambio |
|------|--------|
| Router | Lazy `import()`; Login eager |
| Dashboard | `defineAsyncComponent` por rol |
| Client360 / Library | Paneles / dialogs pesados async |
| Catálogo FE | `shallowRef` + `fields=summary` + search `q` limit 40 en picker |
| API exercises | `?fields=summary` |
| API diets | `?summary=1` en listado |
| Media | `loading="lazy"` / `preload="none"` offscreen |

## Convenciones para PRs futuros

1. **Nueva ruta de vista** → siempre `() => import(...)`. Solo Login (u otra landing crítica) puede ser eager.
2. **Listados de ejercicios** que no muestran ficha técnica → `fields=summary`.
3. **Listas >50 en DOM** → paginación, búsqueda server o `v-virtual-scroll` (Vuetify). No montar catálogos enteros en menús.
4. **Arrays grandes reemplazados de golpe** → preferir `shallowRef`.
5. **Modales / tabs pesados** no visibles al primer paint → `defineAsyncComponent`.
6. **`<img>` offscreen** → `loading="lazy"`; thumbs `<video>` → `preload="none"` salvo reproducción activa.
7. Comentario `// Optimización: ...` en cambios de performance.

## Métricas a vigilar

- Tamaño del chunk inicial (Vite build / Network).
- Tiempo y bytes de `GET /exercises` en Programming / Library.
- Tamaño de `GET /trainer/diets` en listados.
- TBT al abrir Client360 y Workout Player (lazy).

## Follow-ups (fuera de 089)

- Paginación `GET /clients` y `GET /templates`.
- Evitar full-table scan por nombre en `enrichRoutinesWithCatalogMedia` (legacy sin `exercise_id`).

## Checklist review de performance

- [ ] ¿La ruta es lazy?
- [ ] ¿El listado evita TEXT/blobs innecesarios?
- [ ] ¿El menú/lista DOM está acotado (<50 visibles o virtualizado)?
- [ ] ¿Media offscreen es lazy?
- [ ] ¿Auth / validaciones / ownership intactos?
