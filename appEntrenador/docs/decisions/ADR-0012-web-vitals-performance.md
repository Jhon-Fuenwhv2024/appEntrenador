# ADR-0012 · Optimización Web Vitals (code-splitting, proyecciones list, picker slim)

**Estado:** aceptada  
**Feature:** [089-web-vitals-performance](../../spec/features/089-web-vitals-performance/spec.md)  
**Relacionados:** [008/009 catálogo](../../spec/features/008-exercises-catalog/spec.md), [044 i18n](../../spec/features/044-exercises-i18n-scraping/spec.md), [061 programming](../../spec/features/061-trainer-programming-redesign/spec.md), [043 dietas](../../spec/features/043-diet-plans-module/spec.md)  
**Guía operativa:** [performance-web-vitals.md](../performance-web-vitals.md)

## Contexto

FASE 0 midió tres cuellos: (1) 18 vistas eager en el router, (2) descarga + DOM del catálogo ~900 con TEXT de descripción en autocomplete, (3) listados de dietas con árbol days→meals→items. No hay Pinia; el estado vive en vistas/composables.

## Decisión

1. **Lazy routes** — todas las rutas excepto Login usan `() => import(...)`. Dashboard carga async solo la vista del rol activo.
2. **Proyección `fields=summary` en `GET /exercises`** — omite `description` / `description_es`. Sin flag = respuesta completa (compat). Detalle/edición sigue sin summary.
3. **`summary=1` en `GET /trainer/diets`** — listado de headers sin `loadDaysWithMeals`. Detalle por id / sin flag = árbol completo.
4. **Picker de ejercicios** — índice slim en `shallowRef` (lookups/preview); menú del autocomplete alimentado por búsqueda server `q` con `limit≤40`, no 900 `:items`.
5. **`shallowRef` para arrays de catálogo** grandes (reemplazo de raíz).
6. **No alterar** el enrich de rutinas que aporta `description_es` al player/preview/tech sheet.
7. **Media offscreen** — `loading="lazy"` / `preload="none"`; el video del ejercicio en reproducción permanece inmediato.
8. **Async islands** — paneles pesados de Client360 y `TemplateFormDialog` con `defineAsyncComponent`.

## Consecuencias

- Bundle inicial más pequeño (mejor LCP/TBT post-login).
- Menos bytes y menos proxies Vue en programación/plantillas.
- Callers de listado de dietas deben pedir detalle si necesitan el árbol.
- Follow-ups documentados: paginar clients/templates; optimizar legacy name-scan en `enrichRoutinesWithCatalogMedia`.

## Alternativas rechazadas

- Nueva lib de virtual-scroll (npm) — Vuetify ya ofrece `v-virtual-scroll`; el picker se resuelve mejor con búsqueda server.
- Cambiar el default de `GET /exercises` a slim — rompería compatibilidad.
- Paginación de clients en 089 — bajo impacto típico; fuera de alcance.
- Quitar descripciones del enrich de rutinas — regresión en tech sheet / preview.
