# 001 · Modularizar auth y API compartida — Plan

## Enfoque

Refactor mecánico y gradual: extraer sin cambiar contratos de API ni UX. Frontend adopta `shared/api` + `features/auth`; backend agrupa auth en `modules/auth`. Se evita big-bang del resto de carpetas (`trainer`, `client`, `routines`).

## Implementación

1. Crear `src/shared/api/http.js` (o similar) con baseURL configurable (`import.meta.env.VITE_API_URL` con fallback a `http://localhost:3000/api`) y exportar instancia Axios.
2. Crear `src/features/auth/` y mover/adaptar `Login.vue`, `Register.vue` (y helpers de sesión en `localStorage` si aplica) para usar el cliente compartido.
3. Actualizar `src/router.js` (o `src/router/index.js` si se reubica) para importar desde `features/auth`.
4. Crear `backend/src/modules/auth/` con routes, controller y service a partir de `routes/authRoutes.js` + `controllers/authController.js`; montar en `server.js`.
5. Dejar stubs o reexports temporales si hace falta para no romper imports antiguos; eliminar duplicados cuando el router/server apunten a lo nuevo.
6. Verificar manualmente: login trainer/client, registro con token, generate-token desde dashboard entrenador.
7. Actualizar roadmap al marcar tasks completas.

## Decisiones

- **JS sin TypeScript** — respeta el stack actual de la constitución.
- **Sin Pinia aún** — la sesión puede seguir en `localStorage` + composable ligero si se extrae; Pinia es backlog.
- **Sin JWT en esta feature** — solo reorganización; seguridad server-side es la siguiente prioridad de producto tras esta base.
- **Mover solo auth** — no reorganizar trainer/client/routines todavía.

## Riesgos

- **Rutas de import rotas** — mitigar con build Vite (`npm run build`) y smoke test de rutas.
- **bcrypt ausente en backend/package.json** — si al mover el módulo falla el require, documentar y pedir permiso para añadir la dependencia al backend (no silenciar el error).
- **Doble carpeta appEntrenador** — trabajar siempre bajo `appEntrenador/appEntrenador/` donde vive el código real.
