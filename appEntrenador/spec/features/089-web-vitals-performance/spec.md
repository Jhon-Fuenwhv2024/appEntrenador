# 089 · Optimización radical de velocidad y rendimiento (Web Vitals)

**Estado:** implementado  
**Depende de:** 008/009 (catálogo), 044 (i18n/media), 061 (programming), 043 (dietas), router/shell existentes  
**Skills:** `vue-best-practices`, `express-mysql-backend`  
**Docs:** [ADR-0012](../../../docs/decisions/ADR-0012-web-vitals-performance.md), [performance-web-vitals.md](../../../docs/performance-web-vitals.md), [api.md](../../../docs/api.md)

## Qué hace

Mejora LCP/TBT y el peso de red/DOM **sin cambiar** la lógica de negocio, validaciones ni auth. El usuario solo percibe más velocidad.

## Problema (FASE 0)

1. **Bundle inicial sin code-splitting** — `src/router.js` importa las 18 vistas de forma estática; `Dashboard.vue` carga trainer + client a la vez.
2. **Catálogo ~900 ejercicios en red + DOM** — `getAllExercises()` trae filas con `description`/`description_es` y se enlaza entero a `v-autocomplete`.
3. **Payloads de listado gordos** — `GET /exercises` siempre incluye TEXT de descripción; `listDietPlans` embebe días→comidas→ítems para todos los planes.

## NFRs

- Rutas principales lazy (`() => import(...)`); Login eager.
- Listados de ejercicios con proyección `fields=summary` cuando la UI no necesita descripciones.
- Picker de programación: menú ≤40 resultados (búsqueda server); índice slim en `shallowRef` para lookups/preview.
- Dietas: listado opcional `summary=1` sin árbol anidado.
- Media offscreen: `loading="lazy"` / `preload="none"` sin romper el player activo.
- Cambios de API **aditivos** (compat sin flags).

## Criterios de aceptación

- [x] Rutas (excepto Login) cargan con lazy import; Dashboard async por rol.
- [x] Client360 / Library: paneles pesados con `defineAsyncComponent` donde aplica.
- [x] Autocomplete de ejercicios no monta ~900 nodos DOM; búsqueda debounced server-side.
- [x] `GET /exercises?fields=summary` omite descripciones; default sin flag = comportamiento previo.
- [x] `GET /trainer/diets?summary=1` devuelve headers sin `loadDaysWithMeals`.
- [x] Player/preview siguen recibiendo `description_es` vía enrich de rutinas.
- [x] Documentación completa (SDD, ADR-0012, performance, api, data-flows, architecture).
- [x] Build FE OK; smoke de módulos backend.

## Safe Mode

- Cero cambios en auth, ownership, validaciones de formularios o reglas de dominio.
- Comentario `// Optimización: ...` en cada cambio relevante.

## Fuera de alcance

- Paginación de `GET /clients` / templates.
- Reescritura del fallback full-table-scan por nombre en `enrichRoutinesWithCatalogMedia`.
- Nuevas dependencias npm / Pinia.
- Actualizar Kanban Obsidian / roadmap macro.
