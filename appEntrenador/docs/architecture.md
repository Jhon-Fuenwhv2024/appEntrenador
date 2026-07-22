# Arquitectura

Trainfit usa una migración modular gradual. La estructura actual mantiene compatibilidad con componentes legacy, pero las nuevas responsabilidades viven bajo límites de feature.

## Frontend

- `src/config/api.js`: resolución automática local vs producción (`localhost` → API local; host público → `VITE_API_URL` o Render).
- `src/shared/api/http.js`: instancia Axios única (`baseURL` desde `resolveApiBaseUrl()`), Bearer JWT e interceptor de errores/401.
- `src/shared/auth/session.js`: persistencia de token + datos de usuario en `localStorage`.
- `src/shared/layout/AppShell.vue` + `AppBottomNav.vue`: shell autenticado (sidebar desktop / bottom nav móvil ≤960px). Estilos en `src/assets/appShell.css`.
  - **Trainer (4 slots):** Inicio (`/dashboard`), Alumnos (`/trainer/clients`), Biblioteca (`/trainer/library`), Ajustes (`/trainer/settings`). Logout: menú de cuenta en header (Feature 063) + pie sidebar desktop.
  - **Session header (063):** `SessionHeaderActions` + `UserAccountMenu` en `src/shared/layout/` — campana (`NotificationBadge`, badge numérico) + avatar con menú (perfil/ajustes + cerrar sesión con confirmación). En trainer el trigger muestra chip de plan SaaS (`FREE`/`PRO`). Layout del page header (`.dashboard-header` / `.header-right`) vive en `appShell.css` para anclar utilidades arriba-derecha en todas las vistas. Composable `useSessionAccount`.
  - **Contexto (no ítem de barra):** ficha `/trainer/clients/:clientId` marca Alumnos; catálogo `/trainer/exercises` es herramienta de Biblioteca (sin slot propio).
  - **Client (3 slots):** Inicio (`/dashboard`), Progreso (`/client/progress`, Feature 021), Perfil (`/client/profile`). Workout Player y preview de rutina (`/client/routine/:id`, Feature 058) sin bottom nav.
- `src/features/auth/`: vistas de login/registro y llamadas de auth.
- `src/features/trainer/`: portal del entrenador, clientes, invitaciones (`InvitesManager` en Alumnos + `InviteClientAction` en Inicio), ficha 360 (`client-360/Client360View` en `/trainer/clients/:clientId`; Programación 061 = week board + day builder + assign plantilla), lista de alumnos (`ClientsListView`), biblioteca de plantillas (`LibraryView` en `/trainer/library`), placeholder `TrainerSettingsView` (024). Inicio (`TrainerDashboardView`) es hub de métricas + invitación + CTA a Alumnos. Paywall 402 (Feature 037) en create-invite.
- `src/features/saas/`: panel SuperAdmin `/backoffice` (`SuperAdminDashboardView`) — visible solo si `is_superadmin` (Feature 037).
- `src/features/client/`: portal del cliente — rutinas (`ClientDashboardView`), preview de rutina (`ClientRoutinePreviewView`, Feature 058), progreso (`ClientProgressView`), perfil (`ClientProfileView`), player (`WorkoutPlayerView`), dieta (`ClientDietView`, Feature 057).
  - Descanso resiliente (Feature 028): `composables/useTimer.js` (timestamp + Page Visibility + beep `assets/sounds/rest-complete.wav`) integrado en `useWorkoutSession`.
- `src/shared/components/WorkoutSessionHistoryList.vue`: historial expandible de sesiones (cliente + ficha trainer).
- `src/components/Dashboard.vue`: composición por rol; enruta a trainer o client sin contener lógica de feature.

Los componentes legacy `src/components/Login.vue`, `src/components/Register.vue`, `src/components/TrainerDashboard.vue` y `src/components/ClientDashboard.vue` quedan como wrappers cuando aplica.

## Tema visual (Vuetify)

- Tema dark en `src/plugin/vuetify.js` con `dark: true`, `on-primary` / `on-success` = `#0B0D12`, y `surface-variant` oscuro para selects. Ver [`docs/decisions/ADR-0001-contrast-on-primary.md`](decisions/ADR-0001-contrast-on-primary.md).
- Accesibilidad visual (baja visión, WCAG 2.2 AA): [`docs/decisions/ADR-0002-visual-accessibility-low-vision.md`](decisions/ADR-0002-visual-accessibility-low-vision.md) + matriz [`docs/accessibility-visual.md`](accessibility-visual.md). Tokens muted/bordes + `:focus-visible` en [`src/assets/theme-base.css`](../src/assets/theme-base.css).
- Preferir `color="primary"` en CTAs frente a hex `#00E5FF`.
- Menús overlay: clase `tf-overlay-menu` vía defaults del plugin + [`src/assets/theme-base.css`](../src/assets/theme-base.css).
- Reglas Cursor: `.cursor/rules/ui-contrast-theme.mdc`, `.cursor/rules/ui-visual-accessibility.mdc`.

## Backend

El backend monta módulos bajo `/api` desde `backend/src/server.js`.

- DB: `backend/src/config/db.js` usa variables `DB_*` (local XAMPP por defecto; Render/TiDB vía env + `DB_SSL`).
- Despliegue: [`docs/deploy-render.md`](deploy-render.md) (API) y [`docs/deploy-cloudflare.md`](deploy-cloudflare.md) (frontend).
- `backend/src/middleware/auth.js`: JWT (`authenticate`) y roles (`requireRole`); claim `is_superadmin` en `req.user`.
- `backend/src/middleware/requireSuperAdmin.js` + `checkTrainerLimits.js`: gate SuperAdmin y límite FREE (Feature 037).
- `backend/src/modules/auth/`: login (emite JWT con `is_superadmin`) y registro por invitación (consume token vía `invites`).
- `backend/src/modules/saas/`: panel dueño — `GET/PUT /api/saas/trainers...` (Feature 037).
- `backend/src/modules/invites/`: gestión de invitaciones (Feature 023) — `POST/GET /api/invites`, `PATCH /api/invites/:id/revoke`; alias `POST /api/generate-token`. Estados: `pending` | `used` | `revoked`. `POST /invites` aplica `checkTrainerLimits`.
- `backend/src/modules/clients/`: listado/detalle/overview 360 de clientes del trainer autenticado (incluye resumen de membresía en listado/overview).
- `backend/src/modules/memberships/`: membresía / control de pago del alumno (Feature 040) — `GET/PUT /clients/:id/membership`, `GET /me/membership`; soft-lock `MEMBERSHIP_BLOCKED` en rutinas/workout del cliente.
- `backend/src/modules/personal-records/`: PRs de peso (Feature 041) — detección al cerrar sesión, `GET /me/personal-records`, `GET /clients/:id/personal-records`; notificación `pr_achieved`.
- `backend/src/modules/consistency/`: rachas y score (Feature 042) — `GET /me/consistency`, `GET/PUT /clients/:id/consistency` (meta semanal); recalculo al cerrar sesión.
- `backend/src/modules/routines/`: CRUD de rutinas/ejercicios (líneas de rutina) con ownership.
- `backend/src/modules/templates/`: CRUD de plantillas + `POST /templates/:id/assign` (deep copy a `rutinas`/`ejercicios`; Feature 018).
- `backend/src/modules/exercises/`: catálogo `exercises` — `GET/POST /api/exercises` (trainer: globales + propios). Seed (`backend/scripts/seedExercises.js`) desde clone local de wrkout/exercises.json; `media_url` = raw GitHub. Las líneas de rutina/plantilla pueden vincularse con `exercise_id` + `nombre` denormalizado (Feature 022). Ver [`docs/database-schema.md`](database-schema.md).
- `backend/src/modules/admin-exercises/`: HITL superadmin — `GET /api/admin/exercises/untagged`, `PATCH /api/admin/exercises/:id/tag` (`primary_muscle` / `secondary_muscles`). UI: `/admin/exercises/tagger`. Ver [`docs/exercise-muscle-tagger.md`](exercise-muscle-tagger.md).
- `backend/src/modules/workout-sessions/`: `POST/GET /me/workout-sessions` (client, array) y `GET /clients/:id/workout-sessions` (trainer, paginado `{ sessions, hasMore, total }` — Feature 060). Feature 012 + 021.
- `backend/src/modules/body-composition/`: historial antropométrico (Feature 026).
- `backend/src/modules/progress/`: series para gráficas — `GET /progress/metrics/:clientId`, `GET /progress/exercises/:clientId` (Feature 027).
- `backend/src/modules/nutrition/`: objetivos diarios macros/calorías — `GET/PUT /api/nutrition/:clientId` (Feature 031).
- `backend/src/modules/habits/`: hábitos diarios trainer→client (Feature 032).
- `backend/src/modules/checkins/`: check-in semanal + fotos de progreso opcionales (Feature 033). Multer en `uploads/photos`.
- `backend/src/modules/messages/`: chat interno trainer↔cliente vía REST + SSE in-memory (Feature 034). Sin Socket.io.
- Frontend trainer: `LibraryView` es el hub (tabs Plantillas | Catálogo en `/trainer/library` y `/trainer/library/exercises`); ficha 360 / `TemplateFormDialog` usan autocomplete híbrido (`nombre` + `exercise_id`).
- Frontend gráficas: `src/shared/components/ProgressLineChart.vue` + `ProgressChartsPanel.vue` (chart.js); pestaña en `ClientProgressView` y sección Gráficas de `Client360View`.

Cada módulo sigue la forma `routes -> controller -> service`. Los services concentran consultas MySQL parametrizadas y los controllers traducen a respuestas JSON.

## Ownership

- `invitaciones.trainer_id`: trainer que generó el token.
- `usuarios.trainer_id`: trainer dueño del cliente (NULL en trainers).
- Las mutaciones de rutinas validan que el alumno pertenezca a `req.user.id`.
