# 001 · Modularizar auth y API compartida — Tareas

## Preparación

- [x] Leer `AGENTS.md`, `spec/constitution/mission.md`, `spec/constitution/tech-stack.md` y esta feature (`spec.md`, `plan.md`, `tasks.md`).
- [x] Aplicar `vue-best-practices`: revisar reactividad, SFC, data-flow y composables antes de tocar `.vue`.
- [x] Confirmar que Context7 esté disponible; si no lo está, usar el fallback de `AGENTS.md` (código local + skill Vue + docs del proyecto).
- [x] Revisar `src/components/Login.vue`, `src/components/Register.vue`, `src/components/TrainerDashboard.vue`, `src/router.js`, `backend/src/server.js`, `backend/src/routes/authRoutes.js` y `backend/src/controllers/authController.js`.

## Frontend

- [x] Crear `src/shared/api/http.js` con instancia Axios y `baseURL` configurable (`import.meta.env.VITE_API_URL` + fallback `http://localhost:3000/api`).
- [x] Agregar interceptor de respuesta en Axios que normalice errores backend (`success`, `error`/`message`, `code`) sin hacer `catch` silenciosos.
- [x] Crear `src/features/auth/` como límite de feature.
- [x] Mover/adaptar `Login.vue` a `src/features/auth/LoginView.vue` o `src/features/auth/Login.vue` manteniendo la ruta `/`.
- [x] Mover/adaptar `Register.vue` a `src/features/auth/RegisterView.vue` o `src/features/auth/Register.vue` manteniendo la ruta `/registro`.
- [x] Extraer llamadas HTTP de login/registro hacia `src/features/auth/api/authApi.js` usando `shared/api/http.js`.
- [x] Mantener estado local mínimo en los formularios; derivar valores con `computed` solo si aporta claridad.
- [x] No introducir Pinia ni TypeScript en esta feature.
- [x] Actualizar `src/router.js` para importar las vistas desde `src/features/auth/`.
- [x] Revisar `TrainerDashboard.vue` para que `generate-token` use el cliente compartido sin mover todavía el dashboard completo.

## Backend

- [x] Crear `backend/src/modules/auth/`.
- [x] Crear `backend/src/modules/auth/auth.routes.js` con `POST /login`, `POST /register` y `POST /generate-token`.
- [x] Crear `backend/src/modules/auth/auth.controller.js` para traducir HTTP request/response hacia el service.
- [x] Crear `backend/src/modules/auth/auth.service.js` con lógica de login, registro e invitación.
- [x] Mantener SQL parametrizado con `mysql2`.
- [x] Responder errores con formato unificado: `{ success: false, error: "Mensaje", code: 400 }`.
- [x] Montar el módulo auth desde `backend/src/server.js` bajo `/api`.
- [x] Retirar o reexportar `backend/src/routes/authRoutes.js` y `backend/src/controllers/authController.js` para evitar duplicación rota.
- [x] No cambiar schema MySQL ni añadir JWT/sesiones.

## Validación

- [x] Ejecutar `npm run build` en el frontend.
- [x] Arrancar/verificar backend con `npm start` si el entorno local lo permite.
- [x] Smoke test manual: login trainer.
- [x] Smoke test manual: login client.
- [x] Smoke test API: registro rechaza token inválido con error JSON unificado.
- [x] Smoke test manual: generate-token desde dashboard entrenador.
- [x] Confirmar que `/`, `/registro` y `/dashboard` siguen resolviendo.
- [x] Validar contra todos los criterios de aceptación de `spec.md`.

## Documentación y cierre

- [x] Actualizar documentación en `docs/` si se documentan contratos de API, flujo de auth o decisiones técnicas.
- [x] Marcar checks completados en este `tasks.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md` al terminar.

## Mantenimiento (checklist recurrente)

- [x] Al añadir un endpoint de auth, colocarlo en `modules/auth`, no inline en `server.js`.
- [x] Al añadir llamadas HTTP desde Vue, usar `shared/api`, no URLs sueltas en componentes.
