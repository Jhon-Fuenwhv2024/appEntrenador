# 039 · Plan — Ficha 360 del Alumno

## Enfoque

1. Extraer `ClientRoutinesView.vue` en carpeta `src/features/trainer/client-360/`:
   - `Client360View.vue` (orquestador / ruta)
   - `Client360Header.vue`
   - `Client360Overview.vue`
   - Secciones que reutilizan paneles actuales
2. Backend: endpoint `GET /clients/:clientId/overview` en `modules/clients` (service con queries agregadas + ownership).
3. Router: apuntar `ClientRoutines` a la nueva vista; tabs vía `?tab=` o sub-rutas opcionales.
4. Integrar gradualmente chips de 040/041/042 cuando sus APIs existan (props opcionales / null-safe).
5. Actualizar `docs/api.md` y `docs/data-flows.md` con overview.

## Archivos clave

- FE actual: `src/features/trainer/ClientRoutinesView.vue` (+ componentes en `components/`)
- FE nuevo: `src/features/trainer/client-360/*`
- Router: `src/router.js`
- BE: `backend/src/modules/clients/` (routes, controller, service)
- Docs: `docs/api.md`, `docs/architecture.md`

## Riesgos

- Vista monolítica grande: migrar por secciones sin big-bang de lógica de rutinas.
- No romper ownership ni uploads de perfil/fotos.
- Mantener contraste en tabs/menus (`tf-overlay-menu`).
