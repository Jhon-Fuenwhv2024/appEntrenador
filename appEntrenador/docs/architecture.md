# Arquitectura

Trainfit usa una migración modular gradual. La estructura actual mantiene compatibilidad con componentes legacy, pero las nuevas responsabilidades viven bajo límites de feature.

## Frontend

- `src/shared/api/http.js`: instancia Axios única, `baseURL` configurable con `VITE_API_URL`, Bearer JWT e interceptor de errores/401.
- `src/shared/auth/session.js`: persistencia de token + datos de usuario en `localStorage`.
- `src/shared/layout/AppShell.vue` + `AppBottomNav.vue`: shell autenticado (sidebar desktop / bottom nav móvil ≤960px). Estilos en `src/assets/appShell.css`.
  - **Trainer (4 slots):** Inicio (`/dashboard`), Alumnos (`/trainer/clients`), Biblioteca (`/trainer/library`), Ajustes (`/trainer/settings`). Logout fuera de los slots (header móvil / pie sidebar).
  - **Contexto (no ítem de barra):** ficha `/trainer/clients/:clientId` marca Alumnos; catálogo `/trainer/exercises` es herramienta de Biblioteca (sin slot propio).
  - **Client (3 slots):** Inicio (`/dashboard`), Progreso (`/client/progress`, Feature 021), Perfil (`/client/profile`). Workout Player sin bottom nav.
- `src/features/auth/`: vistas de login/registro y llamadas de auth.
- `src/features/trainer/`: portal del entrenador, clientes, invitaciones (`InvitesManager` en Alumnos + `InviteClientAction` en Inicio), rutinas (`ClientRoutinesView`), lista de alumnos (`ClientsListView`), biblioteca de plantillas (`LibraryView` en `/trainer/library`), placeholder `TrainerSettingsView` (024). Inicio (`TrainerDashboardView`) es hub de métricas + invitación + CTA a Alumnos.
- `src/features/client/`: portal del cliente — rutinas (`ClientDashboardView`), progreso (`ClientProgressView`), perfil (`ClientProfileView`), player (`WorkoutPlayerView`).
- `src/shared/components/WorkoutSessionHistoryList.vue`: historial expandible de sesiones (cliente + ficha trainer).
- `src/components/Dashboard.vue`: composición por rol; enruta a trainer o client sin contener lógica de feature.

Los componentes legacy `src/components/Login.vue`, `src/components/Register.vue`, `src/components/TrainerDashboard.vue` y `src/components/ClientDashboard.vue` quedan como wrappers cuando aplica.

## Tema visual (Vuetify)

- Tema dark en `src/plugin/vuetify.js` con `dark: true`, `on-primary` / `on-success` = `#0B0D12`, y `surface-variant` oscuro para selects. Ver [`docs/decisions/ADR-0001-contrast-on-primary.md`](decisions/ADR-0001-contrast-on-primary.md).
- Preferir `color="primary"` en CTAs frente a hex `#00E5FF`.
- Menús overlay: clase `tf-overlay-menu` vía defaults del plugin + [`src/assets/theme-base.css`](../src/assets/theme-base.css).
- Regla Cursor: `.cursor/rules/ui-contrast-theme.mdc`.

## Backend

El backend monta módulos bajo `/api` desde `backend/src/server.js`.

- `backend/src/middleware/auth.js`: JWT (`authenticate`) y roles (`requireRole`).
- `backend/src/modules/auth/`: login (emite JWT) y registro por invitación (consume token vía `invites`).
- `backend/src/modules/invites/`: gestión de invitaciones (Feature 023) — `POST/GET /api/invites`, `PATCH /api/invites/:id/revoke`; alias `POST /api/generate-token`. Estados: `pending` | `used` | `revoked`.
- `backend/src/modules/clients/`: listado/detalle de clientes del trainer autenticado.
- `backend/src/modules/routines/`: CRUD de rutinas/ejercicios (líneas de rutina) con ownership.
- `backend/src/modules/templates/`: CRUD de plantillas + `POST /templates/:id/assign` (deep copy a `rutinas`/`ejercicios`; Feature 018).
- `backend/src/modules/exercises/`: catálogo `exercises` — `GET/POST /api/exercises` (trainer: globales + propios). Seed (`backend/scripts/seedExercises.js`) desde clone local de wrkout/exercises.json; `media_url` = raw GitHub. Las líneas de rutina/plantilla pueden vincularse con `exercise_id` + `nombre` denormalizado (Feature 022). Ver [`docs/database-schema.md`](database-schema.md).
- `backend/src/modules/workout-sessions/`: `POST/GET /me/workout-sessions` (client) y `GET /clients/:id/workout-sessions` (trainer). Feature 012 + 021.
- `backend/src/modules/body-composition/`: historial antropométrico (Feature 026).
- `backend/src/modules/progress/`: series para gráficas — `GET /progress/metrics/:clientId`, `GET /progress/exercises/:clientId` (Feature 027).
- Frontend trainer: `LibraryView` es el hub (tabs Plantillas | Catálogo en `/trainer/library` y `/trainer/library/exercises`); `ClientRoutinesView` / `TemplateFormDialog` usan autocomplete híbrido (`nombre` + `exercise_id`).
- Frontend gráficas: `src/shared/components/ProgressLineChart.vue` + `ProgressChartsPanel.vue` (chart.js); pestaña en `ClientProgressView` y `ClientRoutinesView`.

Cada módulo sigue la forma `routes -> controller -> service`. Los services concentran consultas MySQL parametrizadas y los controllers traducen a respuestas JSON.

## Ownership

- `invitaciones.trainer_id`: trainer que generó el token.
- `usuarios.trainer_id`: trainer dueño del cliente (NULL en trainers).
- Las mutaciones de rutinas validan que el alumno pertenezca a `req.user.id`.
