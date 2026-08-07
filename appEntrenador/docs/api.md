# API REST

Base local por defecto: `http://localhost:3000/api`.

El frontend resuelve la URL en `src/config/api.js` (usada por `src/shared/api/http.js`):

| Dónde corre el front | API usada |
|---|---|
| `localhost` / `127.0.0.1` | `http://localhost:3000/api` |
| Cloudflare / host público | `VITE_API_URL` (`.env.production`) o `https://appentrenador.onrender.com/api` |

Axios adjunta `Authorization: Bearer <token>` y normaliza errores con `{ success: false, error, message, code }`.

**CORS en Render:** `CORS_ORIGINS` debe incluir la URL exacta del front (p. ej. `https://entrenadorfit.jhonf172016.workers.dev`).

**CORS en local:** en desarrollo el backend siempre permite `http://localhost:5173` (y `127.0.0.1` / preview `4173`), aunque `CORS_ORIGINS` apunte a un túnel. Si ves `CORS blocked for origin: http://localhost:5173`, reinicia el backend tras actualizar `backend/.env`.

Secretos del backend: copiar `backend/.env.example` a `backend/.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `PORT`, SMTP y `APP_PUBLIC_URL` para Feature 056).

## Auth

### `POST /login`

Autentica un usuario trainer o client y emite un **access JWT** corto + **refresh token** opaco (Feature 083).

Body:

```json
{
  "username": "usuario",
  "password": "clave"
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "message": "¡Login correcto!",
  "user": {
    "id": 1,
    "username": "usuario",
    "nombre": "Nombre",
    "rol": "trainer",
    "is_superadmin": false
  },
  "token": "<jwt-access>",
  "refreshToken": "<opaque-refresh>"
}
```

- `token` (access): TTL vía `JWT_EXPIRES_IN` (default `15m`). Claim `is_superadmin` (boolean). Roles: `trainer` | `client`.
- `refreshToken`: TTL vía `REFRESH_TOKEN_EXPIRES_IN` (default `30d`); se guarda hasheado en `refresh_tokens`; el frontend lo persiste y lo rota en cada renovación.

Credenciales inválidas (UI inline, sin banner):
- Usuario inexistente → `404` `"El usuario ingresado no existe."` (mensaje bajo el campo usuario).
- Contraseña incorrecta → `401` `"La contraseña es incorrecta."` (mensaje solo bajo el campo contraseña).

### `POST /auth/refresh` (público · Feature 083)

Renueva access + refresh (rotación). Body:

```json
{
  "refreshToken": "<opaque-refresh>"
}
```

Respuesta `200`: mismo shape que login (`user`, `token`, `refreshToken`).  
Errores: `400` sin token; `401` inválido/vencido/reutilizado (reuse → revoca todos los refresh del usuario).

### `POST /auth/logout` (Feature 083)

Revoca refresh tokens del usuario. Auth Bearer **opcional** (si el access ya venció, enviar `refreshToken` en el body).

```json
{
  "refreshToken": "<opaque-refresh>"
}
```

Respuesta `200` `{ success: true, message: "Sesión cerrada." }`.

### `POST /register`

Registra un cliente usando una invitación válida con `status = pending`. El servidor fuerza `rol = "client"`, asigna `trainer_id` del creador de la invitación y marca la invitación como `used` (vía `invitesService.validateAndConsumeToken`).

Body:

```json
{
  "username": "cliente",
  "password": "clave",
  "nombre": "Nombre Cliente",
  "email": "cliente@ejemplo.com",
  "token": "token-invitacion"
}
```

`email` es obligatorio (Feature 056), se normaliza a minúsculas y debe ser único.

Errores relevantes:

| Código | Cuándo |
|--------|--------|
| `400` | Falta el token, email inválido, username/email ya en uso |
| `403` | Token inexistente, ya usado/revocado, o sin trainer vinculado |

### `POST /auth/forgot-password` (público · Feature 056)

Solicita un enlace de restablecimiento. **Siempre** responde éxito genérico (sin enumerar si la cuenta existe).

Body (preferido: `username`; `email` queda como compatibilidad):

```json
{
  "username": "camila123"
}
```

El servidor busca el usuario, toma su `email` registrado y envía el enlace. Si no hay email en la cuenta, responde el mismo mensaje genérico.

Respuesta:

```json
{
  "success": true,
  "message": "Si la cuenta existe y tiene un correo registrado, te hemos enviado un enlace para restablecer tu contraseña."
}
```

Si el usuario existe y tiene email: genera token opaco, guarda `SHA-256` + expiry 1h en `usuarios`, envía email SMTP (Nodemailer → Resend) con enlace `${APP_PUBLIC_URL}/reset-password?token=…`.

**Resend / dominio `trainfit.co`:** `SMTP_FROM=Trainfit <noreply@trainfit.co>` tras verificar DNS (DKIM + SPF) en Resend. Mientras el dominio esté `pending`, Resend puede rechazar envíos. Si el envío falla en desarrollo, el backend imprime el enlace de reset en consola.

### `POST /auth/reset-password` (público · Feature 056)

Body:

```json
{
  "token": "token-del-enlace",
  "password": "nuevaSegura"
}
```

Valida hash+expiry, hashea con bcrypt (mín. 6 caracteres), invalida el token. Respuesta `200` con `{ success: true, message }`.

### `POST /generate-token` (trainer + JWT) — alias

Alias de compatibilidad de `POST /invites`. Preferir el módulo de invitaciones.

## Invitaciones (trainer + JWT) — Feature 023

Base: `/api/invites`. Ownership estricto por `trainer_id = req.user.id`. Sin envío por email: el entrenador copia el enlace.

### `POST /invites`

Genera una invitación `pending` vinculada al trainer autenticado.

Headers: `Authorization: Bearer <token>`

Middleware adicional (Feature 037 + 065): `checkTrainerLimits`. Usa el **plan efectivo**:
`PRO` con `saas_expiration_date` (DATE) **&lt; hoy** se trata como FREE (soft-expiry; no se reescribe `saas_plan` en DB).
Si el plan efectivo es FREE y ya tiene **≥ 3** slots (alumnos registrados + invitaciones `pending`), responde `402`:

```json
{
  "success": false,
  "error": "LIMIT_EXCEEDED",
  "message": "Límite de clientes alcanzado en plan gratuito. Actualiza a PRO."
}
```

Si el 402 es por PRO vencido, el `message` indica renovación, p. ej.:
`"Tu plan PRO venció. Renueva para seguir invitando alumnos sin límite."`

### Soft-lock de asientos FREE (Feature 065 opción B)

Cuando el **plan efectivo** es FREE (FREE nativo o PRO vencido), solo los **3 primeros alumnos** del trainer (`usuarios.id ASC`) son editables.

Writes de coaching sobre un alumno fuera del cupo (rutinas, dieta asignada, macros, hábitos, membresía, composición, review de check-in, perfil del alumno) responden `402`:

```json
{
  "success": false,
  "error": "SEAT_LOCKED",
  "message": "Plan gratuito: solo puedes editar tus 3 primeros alumnos. Actualiza a PRO para gestionar todos.",
  "code": "SEAT_LOCKED"
}
```

No se bloquean: login, listados/GET, chat/mensajes, ni plantillas de Recursos sin `clientId`.

Respuesta exitosa (`201`):

```json
{
  "success": true,
  "message": "Token generado con éxito",
  "data": {
    "id": 1,
    "token": "abc123",
    "status": "pending",
    "fecha_creacion": "2026-07-14T12:00:00.000Z",
    "link_invitacion": "http://localhost:5173/registro?token=abc123"
  },
  "token": "abc123",
  "link_invitacion": "http://localhost:5173/registro?token=abc123"
}
```

### `GET /invites`

Lista las invitaciones del trainer (`pending` | `used` | `revoked`), más recientes primero.

Respuesta `data`: array de `{ id, token, status, trainer_id, fecha_creacion, link_invitacion }`.

### `PATCH /invites/:id/revoke`

Cambia a `revoked` solo si estaba `pending` y pertenece al trainer.

Errores: `404` no encontrada / sin ownership; `400` si no está pendiente.

## SaaS / SuperAdmin (Feature 037)

Base: `/api/saas`. Requiere JWT + `req.user.is_superadmin === true` (`requireSuperAdmin`). Sin el flag: `403 FORBIDDEN`.

### `GET /api/saas/trainers`

Lista todos los trainers con `saas_plan`, `saas_expiration_date`, `effective_plan`, `is_expired` y `client_count` (alumnos + invites pending).

- Soft-expiry (Feature 065): si `saas_plan = PRO` y `saas_expiration_date < hoy` → `effective_plan = FREE`, `is_expired = true`. La fila DB no se muta.
- `saas_expiration_date` NULL → PRO sin caducidad (`is_expired = false`).

### `PUT /api/saas/trainers/:id/plan`

Body:

```json
{
  "saas_plan": "PRO",
  "saas_expiration_date": "2026-12-31"
}
```

`saas_plan`: `FREE` | `PRO`. `saas_expiration_date`: `YYYY-MM-DD` o `null`. UPSERT en `trainers_info`.
La respuesta incluye también `effective_plan` e `is_expired`.

UI: `/backoffice` (solo si `is_superadmin` en sesión). Chip **Vencido** + CTA **Renovar Plan** cuando `is_expired`.

## Clientes (trainer + JWT)

### `GET /trainer/dashboard`

Métricas del portal trainer (solo alumnos propios). Feature 015 + KPIs analíticos Feature 035.

Respuesta `data`:

```json
{
  "clientsCount": 2,
  "routinesCount": 5,
  "sessionsThisMonth": 3,
  "growthPercent": 100,
  "clientsThisMonth": 1,
  "clientsLastMonth": 0,
  "monthlyActivity": [
    { "month": "2026-02", "label": "feb", "clients": 1, "sessions": 0 },
    { "month": "2026-07", "label": "jul", "clients": 2, "sessions": 3 }
  ],
  "retention": {
    "active": 9,
    "inactive": 3,
    "ratePercent": 75,
    "windowDays": 14
  },
  "pendingTasks": {
    "unreviewedCheckins": 4,
    "dietsUnassigned": 2,
    "total": 6
  },
  "weekProgress": {
    "sessionsCompleted": 18,
    "previousWeekSessions": 12,
    "vsPreviousPercent": 50,
    "weekStart": "2026-07-13",
    "byDay": [
      { "date": "2026-07-13", "count": 3 },
      { "date": "2026-07-14", "count": 2 }
    ]
  },
  "payments": {
    "active": 2,
    "owing": 1,
    "expired": 0,
    "none": 0,
    "expiringSoon": 1
  }
}
```

- `routinesCount`: rutinas asignadas a alumnos del trainer.
- `sessionsThisMonth`: sesiones `completed` del mes actual.
- `growthPercent`: variación MoM de alumnos nuevos (`created_at`).
- `monthlyActivity`: últimos 6 meses; `clients` = acumulado; `sessions` = del mes.
- `retention`: activos (≥1 sesión `completed` en `windowDays`) vs inactivos; ver [ADR-0003](decisions/ADR-0003-trainer-dashboard-metrics.md).
- `pendingTasks`: check-ins con `reviewed_at IS NULL` + alumnos sin `diet_plans` activo (Feature 043).
- `weekProgress`: semana lun–dom local; serie `byDay` (7 días, ceros incluidos) y comparación vs semana anterior.
- `payments`: conteos de `client_memberships` del trainer (`active` / `owing` / `expired` / sin fila + `expiringSoon` ≤7 días).

### `GET /clients`

Devuelve solo los clientes con `trainer_id = req.user.id`.

Cada ítem incluye `foto_url` (avatar o `null`), `routines_count`, `status` (`Activo` si tiene ≥1 rutina, `Sin plan` si no), `membership` (Feature 040): `{ status, period_start, period_end, days_remaining, block_on_unpaid }` o `null`, y `seat_editable` (boolean; Feature 065): `true` si el plan efectivo es PRO o el alumno está entre los 3 primeros por `id ASC`.

UI trainer: lista en `/trainer/clients` (`ClientsListView`). La búsqueda por nombre/usuario y el filtro de membresía (Al día / Por vencer ≤7 / Vencidos / Pendientes) son **filtros locales** sobre esta respuesta. Click → `/trainer/clients/:clientId`. Avatar vía `foto_url` + fallback por defecto. Eliminar (lista o ficha 360) → `DELETE /clients/:clientId`.

### `GET /clients/:clientId`

Detalle de un cliente propio.

### `DELETE /clients/:clientId` (trainer)

Desvincula al alumno del entrenador autenticado (`trainer_id = NULL`). No borra la cuenta del alumno. También inhabilita (`is_active = 0`) los planes de dieta activos de ese par trainer↔alumno. Solo el dueño (`trainer_id = req.user.id`) puede ejecutarlo.

Respuesta:

```json
{
  "success": true,
  "message": "Alumno eliminado de tu lista",
  "data": { "id": 12, "nombre": "Ana", "username": "ana" }
}
```

### `GET /clients/:clientId/overview` (Feature 039)

Agregado 360 para la ficha del alumno (solo trainer dueño). Incluye perfil, conteos, última sesión, último check-in, targets nutricionales, membresía (040), `consistencyScore` (042), `prsThisMonth` (041) y `seat_editable` (065).

```json
{
  "success": true,
  "data": {
    "client": { "id": 2, "nombre": "Ana", "username": "ana", "seat_editable": true },
    "profile": {
      "user_id": 2,
      "nombre": "Ana",
      "username": "ana",
      "objetivo": "Hipertrofia",
      "foto_url": "/uploads/avatars/user_2.jpg"
    },
    "counts": { "routines": 3, "sessions": 12, "checkins": 4 },
    "lastSession": {
      "id": 10,
      "routine_name": "Empuje",
      "finished_at": "2026-07-16T18:00:00.000Z",
      "status": "completed"
    },
    "lastCheckin": {
      "id": 5,
      "created_at": "2026-07-14",
      "sleep_quality": 4,
      "stress_level": 2,
      "diet_adherence": 5
    },
    "nutritionTargets": {
      "calories": 2200,
      "protein_g": 160,
      "carbs_g": 200,
      "fats_g": 70
    },
    "membership": {
      "status": "active",
      "period_start": "2026-07-01",
      "period_end": "2026-07-31",
      "days_remaining": 14,
      "block_on_unpaid": false
    },
    "consistencyScore": {
      "value": 59,
      "current_streak": 4,
      "best_streak": 12,
      "week_goal": 3,
      "workouts_this_week": 2
    },
    "prsThisMonth": { "count": 2 },
    "seat_editable": true
  },
  "message": "Overview del alumno"
}
```

UI: `/trainer/clients/:clientId` (`Client360View`) con secciones vía `?tab=` (`resumen` | `programacion` | `nutricion` | `medidas` | `checkins` | `graficas` | `chat`). En Resumen (Feature 060 + 066): `MembershipPanel` (vista/edición), `ConsistencyPanel` strip compacto, widgets + historial paginado; Actividad reciente mergea rutina(s) de hoy (`GET /clients/:id/routines` + weekday local) como fila **Pendiente** si no hay sesión.

## Membresía del alumno (Feature 040 + 079 + 080)

Tabla `client_memberships` (1:1 con cliente). `days_remaining` y `amount_due` se calculan en service. Feature 079 añade tipos/precios. Feature 080 sincroniza `status` ↔ montos.

### `GET /clients/:clientId/membership` (trainer)

Membresía del alumno propio (incluye `notes` internas). Incluye `membership_type_id`, `membership_type_name`, `plan_price`, `amount_paid`, `amount_due`. `null` si aún no se configuró.

### `PUT /clients/:clientId/membership` (trainer)

Upsert: `status` (`active` | `owing` | `expired`), `period_start` (obligatorio), `notes`, `block_on_unpaid`, `membership_type_id?`, `amount_paid?`.

- Sin tipo: `period_end` = ciclo mensual (~30 días) como 040; `status` manual (solo auto-expira `active` → `expired` si `period_end < hoy`).
- Con tipo (079): `plan_price` = snapshot del catálogo; `period_end` = `period_start + duration_days - 1`.
- Si `active` y hay `plan_price` sin `amount_paid`, se asume pagado completo.
- **Reglas 080** (cuando hay `plan_price`):
  - `amount_paid > plan_price` → **400** (`El monto pagado no puede superar el valor del plan ($X).`)
  - `period_end < hoy` → `status = expired` (prioridad)
  - `amount_paid >= plan_price` y no vencido → `status = active`
  - `amount_paid < plan_price` y no vencido → `status = owing`
  - `amount_paid` se persiste en cualquier status

### `GET /me/membership` (client)

```json
{
  "success": true,
  "data": {
    "status": "owing",
    "period_start": "2026-07-01",
    "period_end": "2026-07-31",
    "days_remaining": 14,
    "block_on_unpaid": false,
    "membership_type_id": 3,
    "membership_type_name": "Mensual",
    "plan_price": 150000,
    "amount_paid": 50000,
    "amount_due": 100000
  }
}
```

Sin `notes` (privacidad).

### Tipos de membresía (Feature 079)

- `GET /api/trainer/membership-types?include_inactive=1`
- `POST /api/trainer/membership-types` — `{ name, price, duration_days }`
- `PUT /api/trainer/membership-types/:id`
- `DELETE /api/trainer/membership-types/:id` — soft-archive si está asignado

UI hub **Recursos** (antes Biblioteca): `/trainer/library/memberships`.

### Soft-lock `MEMBERSHIP_BLOCKED`

Si `block_on_unpaid = true` **y** el periodo ya terminó **más** los días de gracia (3), entonces:

- `POST /me/workout-sessions` (y guards equivalentes)

responden **403**. **No** se bloquea solo por `status = owing` (pago pendiente / abono) mientras el periodo + gracia sigan vigentes.

Regla: `days_remaining < -3` (es decir, más de 3 días después de `period_end`).

Durante la gracia el status puede mostrarse como `expired`, pero el acceso continúa hasta agotar los 3 días.

```json
{
  "success": false,
  "error": "MEMBERSHIP_BLOCKED",
  "message": "Tu membresía venció — habla con tu entrenador.",
  "code": "MEMBERSHIP_BLOCKED"
}
```

`GET /me/today` **no** falla: incluye `membership` + `membershipBlocked` para que el dashboard muestre chip/banner y deshabilite el CTA Empezar.

Distinto del paywall SaaS **402** `LIMIT_EXCEEDED` (Feature 037).

## Membresía del gym físico (Feature 082)

Tabla `client_gym_memberships` (1:1 con cliente). Independiente de `client_memberships` (pago al entrenador). Solo el cliente lee/escribe. No aplica soft-lock.

### `GET /me/gym-membership` (client)

```json
{
  "success": true,
  "data": {
    "gym_name": "Mi gym",
    "expires_on": "2026-09-15",
    "days_remaining": 12,
    "notify_enabled": true
  }
}
```

`data` es `null` si aún no se configuró.

### `PUT /me/gym-membership` (client)

Upsert: `{ "gym_name"?: string|null, "expires_on": "YYYY-MM-DD", "notify_enabled"?: boolean }`.  
`expires_on` obligatorio. `gym_name` opcional (máx. 120).

### `DELETE /me/gym-membership` (client)

Elimina la fila. `404` si no existía.

## Cuenta / Ajustes (Feature 024)

Endpoints del usuario autenticado (`req.user.id`). Trainer y client.

### `GET /me/account`

Devuelve datos de cuenta:

```json
{
  "id": 1,
  "username": "coach",
  "nombre": "Juan Coach",
  "email": "coach@ejemplo.com",
  "rol": "trainer",
  "telefono": "3001112233",
  "foto_url": "/uploads/avatars/user_1.jpg",
  "saas_plan": "PRO",
  "saas_expiration_date": "2026-01-15",
  "effective_plan": "FREE",
  "is_expired": true
}
```

- `email` vive en `usuarios` (Feature 056; nullable en usuarios legacy).
- Trainer: `telefono` / `foto_url` / `saas_plan` / `saas_expiration_date` desde `trainers_info` (plan default `FREE`).
- Feature 065: `effective_plan` e `is_expired` (soft-expiry en runtime; `NULL` en fecha = PRO sin caducidad).
- Client: `telefono` / `foto_url` desde `alumnos_info` si existen (sin campos SaaS).

### `PUT /me/account`

`multipart/form-data` opcional. Campos: `nombre`, `email`, `telefono`, archivo `foto` (mismo storage R2/local que el perfil alumno, ADR-0004).

Actualiza `usuarios.nombre` / `usuarios.email` y hace upsert en `trainers_info` (trainer) o `alumnos_info` (client) para teléfono/foto.

Respuesta incluye `data` (cuenta) y `token` JWT renovado (para reflejar el nuevo nombre en claims). Mantener sesión en frontend con el token nuevo.

### `POST /me/password`

Body JSON:

```json
{
  "current_password": "actual",
  "new_password": "nuevaSegura"
}
```

Valida bcrypt de la actual, hashea la nueva. La sesión JWT actual **sigue válida** (no fuerza re-login). Roles: `trainer` | `client`.

UI trainer: `/trainer/settings` (perfil colapsable + cambio de contraseña).  
UI client: `/client/profile` (`ChangePasswordForm`, Feature 045).

## Perfil alumno (`alumnos_info` · Feature 020)

Tabla 1:1 con `usuarios` (rol client). Upsert al guardar. Avatares servidos en `/uploads/avatars/...` (fuera de `/api`; **requiere JWT** Bearer o `?token=`). Con env R2 (ADR-0004) el archivo vive en Cloudflare R2 y Express hace de proxy; sin R2, disco local `backend/public/uploads/avatars`. La app web carga avatares con Bearer → blob URL (ADR-0010), no con `?token=` en `<img>`.

### `GET /profile/:userId`

JWT requerido. Ownership:

- **client:** solo `userId === req.user.id`
- **trainer:** solo alumnos con `trainer_id = req.user.id`

Respuesta `data`:

```json
{
  "user_id": 12,
  "nombre": "Ana",
  "username": "ana",
  "email": "ana@ejemplo.com",
  "rol": "client",
  "telefono": "3001234567",
  "fecha_nacimiento": "1998-05-12",
  "sexo": "Femenino",
  "lesiones": "Rodilla izquierda",
  "objetivo": "Hipertrofia",
  "foto_url": "/uploads/avatars/user_12.jpg",
  "ultimo_acceso": "2026-07-14T15:00:00.000Z"
}
```

`foto_url` es `null` si no hay foto personalizada (el frontend usa avatar por defecto).

### `PUT /profile/:userId`

Misma autorización que GET. Acepta `multipart/form-data` (campos de texto + archivo opcional `foto`).

Campos de texto: `email` (en `usuarios`, Feature 056), `telefono`, `fecha_nacimiento`, `sexo`, `lesiones`, `objetivo`.  
Archivo: `foto` (JPEG/PNG/WebP/GIF, máx. 2 MB) → persiste en R2 (si está configurado) o disco local, y guarda URL relativa en `foto_url`.

Si no existe fila en `alumnos_info`, la crea (upsert). `email` se actualiza en `usuarios` (único, válido).  
Si `email` viene vacío u omitido, **no se modifica** el correo actual (permite guardar teléfono/objetivo/etc. en alumnos sin email).

## Rutinas

### `GET /clients/:clientId/routines` (trainer)

Lista rutinas + ejercicios del cliente propio.

Cada ejercicio incluye `last_log` (Feature 019): último peso/reps del alumno para ese **nombre** de ejercicio (no el id de línea; ver deep copy 018), o `null` si no hay historial.

### `POST /clients/:clientId/routines` (trainer)

Crea rutina con ejercicios (transacción).

```json
{
  "dia_semana": "Lunes",
  "nombre_rutina": "Empuje",
  "ejercicios": [
    {
      "nombre": "Press banca",
      "exercise_id": 42,
      "series": 4,
      "repeticiones": 10,
      "peso": 60,
      "rest_time_seconds": 90,
      "superset_letter": "A",
      "indicaciones": "Controlar la bajada"
    }
  ]
}
```

`exercise_id` es opcional (`null` = texto libre / líneas legacy). Debe ser un ejercicio del catálogo visible al trainer (global o propio). Se persiste junto al `nombre` denormalizado.

`rest_time_seconds` (Feature 028): descanso entre series en segundos (entero `0`–`900`; default `90` si se omite). El Workout Player usa este valor en el temporizador.

`superset_letter` (Feature 029): letra de grupo superserie/circuito (`A`–`Z` / `0–9`, 1–2 chars; `null` o vacío si no hay grupo). Se copia al asignar plantillas.

`set_prescription` (Feature 085): array opcional de targets por serie `[{ "set": 1, "reps": 12, "weight": 40 }, ...]`. Si se omite o es `null`, todas las series usan `repeticiones`/`peso`. Si se envía, su longitud define el nº de series; `repeticiones`/`peso` se sincronizan con la serie 1.
### `PUT /routines/:routineId` (trainer)

Reemplaza día, nombre y ejercicios de una rutina propia.

### `DELETE /routines/:routineId` (trainer)

Elimina la rutina (cascade de `ejercicios`).

## Plantillas (Recursos · Feature 018)

Todas requieren JWT + `requireRole('trainer')`. Solo plantillas con `trainer_id = req.user.id`.

### `GET /templates`

Lista plantillas del trainer con `exercises[]`.

### `POST /templates`

Crea plantilla + líneas (transacción).

```json
{
  "name": "Empuje A",
  "notes": "",
  "exercises": [
    {
      "nombre": "Press banca",
      "exercise_id": 42,
      "series": 4,
      "repeticiones": 10,
      "peso": 60,
      "rest_time_seconds": 90,
      "superset_letter": "A",
      "indicaciones": ""
    }
  ]
}
```

`exercise_id` opcional; misma semántica que en rutinas de alumno. `rest_time_seconds` y `superset_letter` se copian al asignar (Features 028 / 029).
### `GET /templates/:id`

Detalle de una plantilla propia.

### `PATCH /templates/:id`

Actualiza nombre/notes y reemplaza ejercicios (transacción).

### `DELETE /templates/:id`

Borra la plantilla (cascade de líneas). **No** borra rutinas ya asignadas a alumnos.

### `POST /templates/:id/assign`

Deep copy a `rutinas` / `ejercicios` del alumno. Body:

```json
{ "clientId": 12, "dia_semana": "Lunes" }
```

`dia_semana` es opcional (default `Lunes`). Valida ownership del `clientId`. Respuesta `201` con la rutina creada (mismo shape que create de rutinas). Sin FK viva hacia la plantilla.

UI: `/trainer/library` (`LibraryView` · hub **Recursos**); “Guardar en Recursos” desde ficha de alumno.

### `GET /me/today` (client) — Feature 038 + 083

Agregador del dashboard immersivo del alumno. Una sola petición con la rutina de hoy, hábitos, macros, consistencia, check-in, chat, dieta y insight.

Headers: `Authorization: Bearer <token>` · rol `client`

Query:

| Param | Obligatorio | Descripción |
|-------|-------------|-------------|
| `date` | recomendado | Fecha civil local `YYYY-MM-DD` (misma convención que `/habits/today`). Si se omite, usa UTC del servidor. |

Respuesta exitosa (campos 083 ampliados):

```json
{
  "success": true,
  "data": {
    "todayRoutine": { "id": 12, "nombre_rutina": "Cardio", "ejercicios": [] },
    "todayCompleted": false,
    "habits": [{ "id": 1, "title": "Beber 2L de agua", "is_completed": false }],
    "macros": { "calories": 2200, "protein_g": 160, "carbs_g": 220, "fats_g": 70 },
    "date": "2026-08-01",
    "weekday": "Sábado",
    "membership": {},
    "membershipBlocked": false,
    "consistency": {
      "current_streak": 0,
      "best_streak": 5,
      "week_goal": 4,
      "workouts_this_week": 2,
      "score": 58
    },
    "checkinDue": true,
    "lastCheckinAt": null,
    "chatPreview": {
      "total": 1,
      "partnerId": 3,
      "preview": "¿Cómo te fue hoy?",
      "lastMessageAt": "2026-08-01T15:00:00.000Z"
    },
    "diet": {
      "planId": 9,
      "title": "Plan mensual",
      "planned": { "calories": 1264, "protein_g": 89, "carbs_g": 148, "fats_g": 38 },
      "eaten": null,
      "nextMeal": {
        "id": 41,
        "name": "Desayuno",
        "time_hint": "09:00",
        "calories": 348,
        "status": null
      },
      "mealAdherence": [{ "diet_meal_id": 41, "status": null }]
    },
    "weekInsight": "2/4 entrenos · proteína plan ~89g · falta entreno hoy"
  }
}
```

- `todayRoutine` es `null` si no hay rutina para ese `weekday` (estado UI “Día de descanso”).
- `todayCompleted` es `true` si existe una `workout_sessions` `completed` de esa rutina cuya fecha civil (en la timezone del alumno, default `America/Bogota`) coincide con `date`. No usa `DATE()` MySQL en UTC.
- `macros` es `null` si el trainer aún no asignó `nutrition_targets`.
- `checkinDue`: sin check-in en los últimos 7 días civiles.
- `diet.eaten`: suma de macros de comidas marcadas `eaten`; `null` si ninguna.
- Shape de rutina/ejercicios = mismo enriquecimiento que `GET /me/routines`.

### `PUT /me/diet-meals/:mealId/adherence` (client) — Feature 083

Marca una comida del plan activo como `eaten` o `skipped` para una fecha civil.

Headers: `Authorization: Bearer <token>` · rol `client`

Body:

```json
{ "date": "2026-08-01", "status": "eaten" }
```

- `status`: `eaten` | `skipped`
- Soft-lock membresía (mismo que plan de dieta)
- Ownership: la comida debe pertenecer a un `diet_plans` del cliente autenticado
- Upsert UNIQUE `(client_id, diet_meal_id, local_date)`

### `GET /me/routines` (client)

Lista las rutinas del cliente autenticado.

Cada ítem de `ejercicios[]` incluye (además de la prescripción):

- `exercise_id` — vínculo al catálogo (nullable; Feature 022)
- `rest_time_seconds` — descanso entre series prescrito por el trainer (Feature 028; default 90)
- `superset_letter` — grupo superserie/circuito (nullable; Feature 029)
- `media_type` / `media_url` / `local_media_path` — resueltos por `exercise_id` si existe; si no, por nombre (Features 008–009 / 022 / 044)
- `name_es` / `description_es` — i18n del catálogo cuando hay match
- `primary_muscle` / `target_muscle` / `target_muscle_es` — musculatura del catálogo (Feature 087, ficha técnica en descanso)
- `last_log` — memoria de progresión (Feature 019):

```json
{
  "id": 30,
  "nombre": "Press banca",
  "series": 4,
  "repeticiones": 10,
  "peso": 60,
  "rest_time_seconds": 90,
  "indicaciones": "",
  "media_type": "youtube",
  "media_url": "https://...",
  "last_log": {
    "weight": 62.5,
    "reps": 10,
    "date": "2026-07-13T20:15:00.000Z"
  }
}
```

`last_log` es `null` si el cliente no tiene series previas en `workout_set_logs` para ese nombre exacto. El match **no** usa `ejercicios.id` (los ids cambian al reasignar plantillas). Ownership: solo logs con `workout_sessions.client_id` = el dueño de la rutina.

## Catálogo de ejercicios (Features 008–009 + 044)

Tabla MySQL `exercises` (diccionario híbrido). Seed desde clone wrkout: `npm run seed:exercises` en `backend/` (ver [`database-schema.md`](database-schema.md)).  
i18n ES + media local: [`exercises-i18n-scraping.md`](exercises-i18n-scraping.md).

### `GET /exercises` (trainer)

Lista ejercicios globales (`created_by_trainer_id IS NULL`) y los del trainer autenticado.

Query:

- `?q=press` — filtro por `name` / `name_es` / `primary_muscle` / `target_muscle*` (LIKE)
- `?muscle=Pecho` — filtro exacto por etiqueta HITL (`primary_muscle` o secundario)
- `?warmup=1` — solo ejercicios con `is_warmup = 1`
- `?limit=6` — tamaño de página (default **6**, máximo **100**)
- `?page=1` — página actual (1-based)
- `?enriched=1` — solo ejercicios con `name_es` o `local_media_path` (Feature 044)
- `?fields=summary` — **Feature 089:** omite `description` / `description_es` (respuesta los deja en `null`). Sin este flag = payload completo (compat).

**Nota FE (089):** el catálogo paginado del trainer usa `limit=6` + `fields=summary`. Los builders de programación/plantillas cargan un **índice slim** (`getAllExercises({ fields: 'summary', enriched: true })`) para lookups/preview y alimentan el menú del autocomplete con búsqueda server (`q`, `limit=40`, `fields=summary`) — no montan ~900 ítems en el DOM.

Respuesta:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bench Press",
      "name_es": "Press de banca",
      "description": "...",
      "description_es": "...",
      "target_muscle": "Chest",
      "target_muscle_es": "Pecho",
      "primary_muscle": "Pecho",
      "secondary_muscles": ["Tríceps", "Hombros"],
      "is_warmup": false,
      "media_type": "gif",
      "media_url": "https://raw.githubusercontent.com/...",
      "local_media_path": "/uploads/exercises/exercise_1.gif",
      "created_by_trainer_id": null,
      "is_global": true
    }
  ],
  "meta": {
    "total": 897,
    "limit": 6,
    "page": 1,
    "totalPages": 150,
    "returned": 6,
    "muscle": null,
    "warmup": false,
    "fields": "full"
  }
}
```

Con `fields=summary`, `meta.fields` es `"summary"` y `description` / `description_es` son `null`.

Media estática: `GET {API_ORIGIN}/uploads/exercises/...` (fuera de `/api`; **público**).
Con env R2 (ADR-0005) Express hace proxy desde Cloudflare R2 (`exercises/…`); sin R2, disco `backend/public/uploads/exercises`. La DB solo guarda `local_media_path`.
**Política Feature 044:** las demos del player/preview solo usan `local_media_path` (GIF hosteado). No se usan JPG wrkout de GitHub.

**Vínculo catálogo (rutinas / plantillas):** al crear/editar, si falta `exercise_id` el backend resuelve por nombre/`name_es`/aliases **solo** contra ejercicios con GIF local.  
Backfill de líneas huérfanas (local o producción):

```bash
cd backend
npm run db:backfill-exercise-links          # dry-run
npm run db:backfill-exercise-links:confirm  # religa a GIF + borra wrkout sin GIF reimportados
```

El cleanup `db:cleanup-exercises-no-local:confirm` es intencional (quita globales sin GIF). Tras usarlo, corre el backfill para religar rutinas a alternativas con GIF.

### `POST /exercises` (trainer)

Crea un ejercicio privado del trainer.

Body JSON (modo URL / sin archivo):

```json
{
  "name": "Mi variación",
  "target_muscle": "Pecho",
  "description": "Opcional",
  "media_type": "none",
  "media_url": null
}
```

También acepta **`multipart/form-data`** (Feature 090) con los mismos campos de texto y archivo opcional `media_file` (JPEG/PNG/WebP/GIF/MP4/WebM, máx. **10 MB**). Con archivo:

- Se persiste en storage (disco local y/o R2) como `/uploads/exercises/trainer_{trainerId}_{uuid}.{ext}`.
- DB: `local_media_path` + `media_type` inferido (`image` | `gif` | `video`); `media_url` queda `null`.

### `PUT /exercises/:id` (trainer)

Actualiza un ejercicio visible (global o privado del trainer): nombre, descripción, músculo, `media_type` y `media_url` (GIF/YouTube/video/imagen).

Misma opción **multipart** que el POST (`media_file`). La subida de archivo **solo** está permitida en ejercicios privados del trainer (`created_by_trainer_id = trainer`); en globales usar URL.

### `DELETE /exercises/:id` (trainer)

Elimina un ejercicio visible (global o privado del trainer).

Las líneas de rutina/plantilla envían `nombre` + `exercise_id` opcional (Feature 022). El player resuelve media por id; fallback por nombre si `exercise_id` es NULL.

UI trainer: ruta `/trainer/exercises` (listar / buscar / crear / editar / borrar) y combobox en `/trainer/clients/:clientId`.

### Admin HITL — etiquetado muscular (superadmin)

Herramienta interna temporal. UI: `/admin/exercises/tagger` (`requiresSuperAdmin`).  
Columnas: `primary_muscle` (VARCHAR), `secondary_muscles` (JSON array).  
Migración: [`backend/db/migrations/025_exercises_muscle_tags.sql`](../backend/db/migrations/025_exercises_muscle_tags.sql).

#### `GET /admin/exercises/untagged` (superadmin)

Devuelve **un** ejercicio con `primary_muscle` NULL o vacío (`LIMIT 1`), ordenado por `id`.

```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Bench Press",
    "name_es": "Press de banca",
    "media_type": "gif",
    "media_url": null,
    "local_media_path": "/uploads/exercises/exercise_12.gif"
  },
  "message": "Ejercicio pendiente de etiquetar"
}
```

Si no hay pendientes: `"data": null` y mensaje de catálogo completado.

`meta` (progreso del catálogo):

```json
{
  "total": 900,
  "tagged": 120,
  "remaining": 780,
  "percent": 13
}
```

#### `PATCH /admin/exercises/:id/tag` (superadmin)

Body:

```json
{
  "primary_muscle": "Pecho",
  "secondary_muscles": ["Tríceps", "Hombros"],
  "is_warmup": false
}
```

Valores permitidos: Pecho, Espalda, Dorsal, Trapecio, Hombros, Bíceps, Braquial, Tríceps, Antebrazo, Core/Abdomen, Oblicuos, Cuádriceps, Femoral, Glúteo, Aductores, Abductores, Gemelos, Pierna, Cardio, Full Body.  
`primary_muscle` y `is_warmup` obligatorios; `secondary_muscles` opcional (no puede incluir el principal).  
`is_warmup: true` = usable como calentamiento para la musculatura etiquetada. Respuesta HTTP **200**.

### `GET /me/routines` — media enriquecida (cliente)

Además de la prescripción, cada ejercicio incluye `media_type` y `media_url` resueltos por coincidencia de nombre contra el catálogo `exercises` (prioridad: privado del trainer del cliente, luego global). Ver también `last_log` en la sección de rutinas (Feature 019).

## Sesiones de entrenamiento (Feature 012)

Ejecución histórica. No modifica `ejercicios.peso` prescrito.

### `POST /me/workout-sessions` (client)

Guarda una sesión completada (o abandonada) con sus series.

Body:

```json
{
  "routine_id": 12,
  "routine_name": "Empuje",
  "started_at": "2026-07-13T20:00:00.000Z",
  "status": "completed",
  "sets": [
    {
      "exercise_id": 30,
      "exercise_name": "Press banca",
      "set_number": 1,
      "weight": 62.5,
      "reps": 10
    }
  ]
}
```

`client_id` siempre es `req.user.id`. `routine_id` debe pertenecer al cliente.

Además, la rutina solo se puede **iniciar/guardar** el día programado (`rutinas.dia_semana` = weekday civil en la timezone del alumno, default `America/Bogota`). Si hoy no es ese día → `403` con `error`/`code`: `ROUTINE_DAY_LOCKED` (preview/ver sigue permitido).

Respuesta `201` (Feature 041 / 042): además de la sesión y `sets[]`, incluye:

- `new_prs[]` — PRs de peso detectados en esa sesión (`exercise_name`, `weight`, `reps`, `previous_max`, …). Vacío si no hay récords.
- `consistency` — payload de racha/score tras recalcular (o `null` si status ≠ `completed`).

## Récords personales / PRs (Feature 041)

Tabla `personal_records`. Detección automática al cerrar sesión (`status = completed`): peso estrictamente mayor al máximo histórico del mismo ejercicio (match por `LOWER(TRIM(exercise_name))`).

### `GET /me/personal-records` (client)

Lista hasta 100 PRs propios (más recientes primero).

### `GET /clients/:clientId/personal-records` (trainer)

Misma lista para alumno propio (ownership).

Notificación in-app `pr_achieved` al cliente (y al trainer) cuando hay al menos un PR nuevo.

## Consistencia / rachas (Feature 042)

Tabla `client_streaks` (`current_streak`, `best_streak`, `week_goal` default 3).

**Score (0–100):** `min(100, round(workouts_this_week / week_goal * 70 + min(current_streak, 10) * 3))`.

Días de racha: calendario UTC con ≥1 sesión `completed` por día; ancla en hoy o ayer.

### `GET /me/consistency` (client)

```json
{
  "success": true,
  "data": {
    "current_streak": 4,
    "best_streak": 12,
    "week_goal": 3,
    "workouts_this_week": 2,
    "score": 59,
    "days_remaining_in_week": 3
  }
}
```

### `GET /clients/:clientId/consistency` (trainer)

Mismo payload para alumno propio.

### `PUT /clients/:clientId/consistency` (trainer) — alias `PUT .../week-goal`

Body: `{ "week_goal": 4 }` (entero 1–14). Devuelve el payload de consistencia actualizado.

`GET /clients/:id/overview` incluye `consistencyScore` y `prsThisMonth.count`.

### `GET /me/workout-sessions` (client) — Feature 021

Lista las sesiones propias del cliente autenticado (máx. 50, más recientes primero). **`data` es un array** de sesiones; cada ítem incluye `sets[]` anidados. Ownership: solo `workout_sessions.client_id = req.user.id` (no acepta `clientId` en params/body).

### `GET /clients/:clientId/workout-sessions` (trainer) — Feature 012 + 060

Historial del alumno propio (ownership). Query opcional:

| Param | Default | Notas |
|-------|---------|--------|
| `limit` | `5` (UI Resumen) / default API `8` | Entero 1–30 |
| `offset` | `0` | Para «Ver más» |

Respuesta:

```json
{
  "success": true,
  "data": {
    "sessions": [ /* … con sets[] */ ],
    "hasMore": true,
    "total": 42,
    "limit": 8,
    "offset": 0
  }
}
```

UI Resumen 360: lista agrupada por día + botón Ver más.

## Composición corporal (Feature 026)

Historial antropométrico fechado. El **IMC se calcula solo en el service** (`weight_kg / (height_cm/100)²`, 2 decimales). El body **nunca** debe incluir `bmi` como fuente de verdad (se ignora si llega).

### `GET /me/body-composition` (client)

Lista las mediciones propias del cliente autenticado, ordenadas por `measured_at DESC`. Solo lectura. Ownership: `client_id = req.user.id`.

### `GET /clients/:clientId/body-composition` (trainer)

Lista mediciones del alumno propio (ownership vía `trainer_id`).

### `POST /clients/:clientId/body-composition` (trainer)

Crea una medición. Campos obligatorios: `weight_kg`, `height_cm`. Opcionales: `measured_at` (default hoy), `body_fat_pct`, circunferencias (`chest_cm`, `waist_cm`, `triceps_cm`, `biceps_cm`, `glutes_cm`, `quads_cm`, `calves_cm`, `back_cm`), `notes`.

```json
{
  "measured_at": "2026-07-14",
  "weight_kg": 78.5,
  "height_cm": 175,
  "body_fat_pct": 18.2,
  "waist_cm": 82,
  "notes": "Post-corte"
}
```

`recorded_by` = `req.user.id`. Respuesta `201` con el registro (incluye `bmi` calculado).

### `PUT /clients/:clientId/body-composition/:logId` (trainer)

Actualiza una medición del alumno propio. Misma forma de body que el POST; el IMC se recalcula.

## Progreso / gráficas (Feature 027)

Series temporales para Chart.js. Roles: `trainer` | `client`. Ownership: el cliente solo puede usar su propio `:clientId`; el trainer solo alumnos con `usuarios.trainer_id = req.user.id`.

### `GET /progress/metrics/:clientId`

Historial de `body_composition_logs` ordenado `measured_at ASC`. Respuesta optimizada para ejes X/Y:

```json
{
  "success": true,
  "data": {
    "labels": ["2026-01-10", "2026-02-10"],
    "weightKg": [78.5, 77.2],
    "bmi": [25.61, 25.18]
  }
}
```

### `GET /progress/exercises/:clientId`

Sin query: lista ejercicios distintos con al menos un set en `workout_set_logs` (selector UI).

```json
{
  "success": true,
  "data": {
    "exercises": [
      { "exerciseId": 12, "exerciseName": "Press banca", "setCount": 24 }
    ]
  }
}
```

Con `?exerciseId=X` (o `?exerciseName=` si el id es nulo): `MAX(weight)` por día (`DATE(finished_at)`), agrupando por **nombre** del ejercicio (estable frente a ids de línea de rutina). Orden `ASC`.

```json
{
  "success": true,
  "data": {
    "exerciseName": "Press banca",
    "labels": ["2026-03-01", "2026-03-08"],
    "maxWeight": [60, 62.5]
  }
}
```

## Notificaciones in-app (Feature 025 + 074)

Campana en el dashboard (trainer y client). Caducan a los **30 días** (`expires_at`). En cada `GET` se purgan expiradas y leídas con más de **3 días**. Deep-link vía `action_url` (path relativo generado solo en servidor).

Eventos:

- Cliente: rutina creada / actualizada / plantilla asignada → `routine_assigned` → preview o `/dashboard`
- Cliente: plan nutricional activado o guardado activo → `diet_updated` → `/dashboard`
- Cliente: PR / racha → `pr_achieved` / `streak_milestone` → `/client/progress`
- Cliente: recordatorio de entreno (job 075) → `workout_reminder` → `/dashboard`
- Cliente: membresía 7/3/1 días, gracia (−1…−3) o vencida (job 075) → `membership_expiring` / `membership_grace` / `membership_expired` → `/dashboard`
- Cliente: membresía del gym físico 7/3/1/0 días (job 082) → `gym_membership_expiring` / `gym_membership_expired` → `/client/profile`
- Cliente: racha en riesgo (job 075) → `streak_at_risk` → `/client/progress`
- Trainer: alumno completa entrenamiento → `routine_completed` → `/trainer/clients/:clientId`
- Trainer: PR de alumno → `pr_achieved` → `/trainer/clients/:clientId`
- Trainer: membresía de alumno por vencer / en gracia / vencida (job 075) → `membership_expiring` / `membership_grace` / `membership_expired` → `/trainer/clients`

### Preferencias de recordatorio (Feature 075)

Auth: solo `client`. Upsert en `client_notification_settings` (defaults: enabled, hora 8, `America/Bogota`).

### `GET /me/notification-settings`

```json
{
  "success": true,
  "data": {
    "workout_reminder_enabled": true,
    "workout_reminder_hour": 8,
    "timezone": "America/Bogota"
  }
}
```

### `PUT /me/notification-settings`

Body parcial o completo: `workout_reminder_enabled` (bool), `workout_reminder_hour` (0–23), `timezone` (IANA válida).

### `GET /notifications`

Lista las notificaciones del usuario autenticado (máx. 50) y el conteo de no leídas. Ejecuta purge scoped a `req.user.id` antes de listar.

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "Plan nutricional actualizado",
        "message": "Tu entrenador actualizó «Déficit suave».",
        "type": "diet_updated",
        "entity_type": "diet_plan",
        "entity_id": 12,
        "action_url": "/dashboard",
        "is_read": false,
        "created_at": "2026-07-28T20:00:00.000Z",
        "expires_at": "2026-08-27T20:00:00.000Z"
      }
    ],
    "unreadCount": 1
  }
}
```

### `PUT /notifications/:id/read`

Marca una notificación propia como leída.

### `PUT /notifications/read-all`

Marca todas las del usuario autenticado como leídas.

### `DELETE /notifications/:id`

Elimina (hard delete) una notificación propia. `404` si no existe o no pertenece al usuario.

## Web Push / PWA (Feature 051)

Suscripciones Web Push por dispositivo (`push_subscriptions`). Requiere VAPID en el servidor. Auth: `trainer` | `client`. Ownership siempre `req.user.id`.

Tras `createNotification`, el servidor intenta push (fire-and-forget). Los DMs también envían push al receptor **sin** crear fila in-app.

### `GET /push/vapid-public-key`

Devuelve la clave pública VAPID para `pushManager.subscribe`.

```json
{
  "success": true,
  "data": { "publicKey": "B…", "enabled": true }
}
```

Sin VAPID: `503` `{ "success": false, "error": "…", "code": 503 }`.

### `POST /push/subscriptions`

Upsert por `endpoint` (UNIQUE). Body:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/…",
  "keys": { "p256dh": "…", "auth": "…" },
  "userAgent": "optional"
}
```

`201` + `{ "success": true, "data": { "endpoint": "…" } }`.

### `DELETE /push/subscriptions`

Body `{ "endpoint": "…" }`. Solo borra si pertenece al usuario. `404` si no existe.

### `POST /push/presence`

Heartbeat: el cliente indica que la app está **visible / en primer plano**. Auth trainer|client. En memoria (~45 s). Si el destinatario está activo (presence reciente), **no** se envía push de `chat_message`. Un SSE zombie con la app en background **no** suprime el push.

### `DELETE /push/presence`

Limpia la presencia (app oculta, logout o unmount del shell).

## Nutrición / objetivos diarios (Feature 031)

Tabla `nutrition_targets` (relación 1:1 con el cliente vía `UNIQUE(client_id)`). Macros y calorías en enteros positivos.

### `GET /nutrition/:clientId`

Devuelve el objetivo actual. Autorizado si:
- el usuario es **trainer** dueño del cliente (`usuarios.trainer_id`), o
- el usuario es el **cliente** (`req.user.id === clientId`).

Si aún no hay plan asignado: `200` con `"data": null` (no es error).

```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_id": 12,
    "trainer_id": 3,
    "calories": 2200,
    "protein_g": 160,
    "carbs_g": 220,
    "fats_g": 70,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Sin plan:

```json
{ "success": true, "data": null }
```

### `PUT /nutrition/:clientId` (trainer)

UPSERT del objetivo. Solo el trainer dueño. Body obligatorio (enteros positivos):

```json
{
  "calories": 2200,
  "protein_g": 160,
  "carbs_g": 220,
  "fats_g": 70
}
```

## Planes de dieta (Feature 043 + 064 ciclo)

Jerarquía: `diet_plans` → `diet_plan_days` (week_index + dia_semana) → `diet_meals` → `diet_items`.

- `cycle_length_weeks`: 2|3|4 (default 4)
- `cycle_start_date`: ancla lunes del ciclo
- Totales del plan = **media** de días con ≥1 item (recalculados en service)
- Totales del día = suma de items del día

**Capa dual de macros:** el frontend muestra totales en vivo; el backend ignora totales enviados a nivel plan/día/comida y recalcula desde `diet_items`.

### `GET /trainer/diets` (trainer)

Lista planes del entrenador. Query:

- `?clientId=` — filtra por alumno (valida ownership).
- `?summary=1` — **Feature 089:** solo headers del plan (`days: []`, `day_count`/`meal_count` en 0). Sin flag = árbol completo `days` → `meals` → `items` (compat).

La UI de Client 360 lista con `summary=1` y carga el detalle con `GET /trainer/diets/:id` al editar.

Respuesta incluye `meta.summary` (boolean).

### `POST /trainer/diets` (trainer)

Crea plan + días + meals + items en transacción. Body:

```json
{
  "client_id": 12,
  "title": "Definición Q3",
  "notes": "Priorizar proteína",
  "is_active": true,
  "cycle_length_weeks": 4,
  "cycle_start_date": "2026-07-20",
  "days": [
    {
      "week_index": 1,
      "dia_semana": "Lunes",
      "notes": null,
      "meals": [
        {
          "name": "Desayuno",
          "sort_order": 0,
          "time_hint": "08:00",
          "items": [
            {
              "food_name": "Avena",
              "quantity": 60,
              "unit": "g",
              "calories": 220,
              "protein_g": 8,
              "carbs_g": 38,
              "fats_g": 4,
              "sort_order": 0
            }
          ]
        }
      ]
    }
  ]
}
```

Respuesta `201` con el plan completo (`days` → `meals` → `items`). Macros del plan = media de días con items.

### `GET /trainer/diets/:id` (trainer)

Detalle con días, meals e items. Solo planes del trainer autenticado.

### `PUT /trainer/diets/:id` (trainer)

Reemplazo nested (UPDATE plan + DELETE `diet_plan_days` CASCADE + re-insert). Recalcula macros.

### `DELETE /trainer/diets/:id` (trainer)

Elimina el plan (CASCADE a days/meals/items).

### `POST /trainer/diets/:id/activate` (trainer)

Marca el plan como activo y desactiva otros del mismo `client_id`. Sincroniza la **media** del ciclo → `nutrition_targets` (031).

### `POST /trainer/diets/:id/deactivate` (trainer)

Inhabilita el plan (`is_active = 0`). El alumno deja de verlo como plan activo. No elimina el plan (sigue editable/reactivable).

### `POST /trainer/diets/:id/copy-day` (trainer)

Deep copy de un día a otro. Body: `{ "from_week_index", "from_dia_semana", "to_week_index", "to_dia_semana" }`.

### `POST /trainer/diets/:id/copy-week` (trainer)

Deep copy semana completa. Body: `{ "from_week", "to_week" }`.

### `GET /me/diet-plan?date=YYYY-MM-DD` (client)

Plan activo del alumno con **día resuelto** según ciclo (`resolved` + `day`). Sin fallback a otro día si está vacío (`day: null`). Si no hay plan: `"data": null`.

### `GET /me/diet-plan/week?date=YYYY-MM-DD` (client)

Preview de los 7 días de la semana del ciclo que contiene `date`.

### `GET /me/diet-plan/shopping-list` (client)

Lista de compra agregada del **plan activo** (ciclo completo 2–4 semanas). Sin tabla nueva: deriva de `diet_plan_days` → meals → items. Agrega por nombre normalizado + `unit`: trim, colapsa espacios y quita sufijos de semana/segmento `(S1)`…`(Sn)` (case-insensitive) antes de la clave; clasifica por macro dominante (`protein` | `carbs` | `fats` | `other`). No fusiona productos con nombre base distinto (ej. `Atún` ≠ `Atún en agua`). Si no hay plan: `"data": null`.

```json
{
  "success": true,
  "data": {
    "plan": { "id": 1, "title": "Definición", "cycle_length_weeks": 4 },
    "groups": [
      {
        "category": "protein",
        "label": "Proteínas",
        "items": [
          {
            "food_name": "Pechuga de pollo",
            "unit": "g",
            "quantity": 1400,
            "calories": 2310,
            "protein_g": 434,
            "carbs_g": 0,
            "fats_g": 50,
            "category": "protein",
            "occurrences": 14
          }
        ]
      }
    ]
  }
}
```

Checklist “comprado” solo en cliente (`localStorage`); no se persiste en servidor.

UI cliente: botón carrito en `ClientDietView` → `/client/shopping-list` (`ClientShoppingListView`). UI trainer: ficha 360 → Nutrición (`DietPlanPanel` / ciclo L–D).

## Lookup nutricional de alimentos (Feature 069)

Proxy autenticado (trainer). Consulta USDA FoodData Central (si hay `USDA_FDC_API_KEY`) y Open Food Facts como fallback. La key **no** se expone al frontend. Macros base por 100 g/ml; se escalan a `quantity` cuando `unit` es `g` o `ml`.

### `GET /trainer/foods/search?q=` (trainer)

Hasta 8 sugerencias `{ id, name, source, per_100g }` para autocomplete. Mínimo 2 caracteres.

### `GET /trainer/foods/lookup?q=&quantity=&unit=&fdcId=` (trainer)

Devuelve macros escalados para rellenar el ítem del plan:

```json
{
  "success": true,
  "data": {
    "query": "Huevo",
    "matched_name": "Egg, whole, raw, fresh, n",
    "quantity": 100,
    "unit": "g",
    "calories": 143,
    "protein_g": 12.6,
    "carbs_g": 0.7,
    "fats_g": 9.5,
    "per_100g": { "calories": 143, "protein_g": 12.6, "carbs_g": 0.7, "fats_g": 9.5 },
    "source": "usda",
    "scaled": true,
    "note": null
  }
}
```

Errores: `400 INVALID_QUERY`, `404 FOOD_NOT_FOUND`.

## Hábitos diarios (Feature 032)

Tablas `habits` + `habit_logs`. Las fechas de completado (`logged_date`) son **cadenas civiles `YYYY-MM-DD`** enviadas por el cliente según su zona local. El backend las valida y las guarda como `DATE` sin convertir a UTC.

### `GET /habits/client/:clientId` (trainer)

Lista hábitos del alumno. Solo el trainer dueño.

### `POST /habits/client/:clientId` (trainer)

Crea hábito. Body: `{ "title": "Beber 2L de agua" }`.

### `DELETE /habits/:id` (trainer)

Elimina el hábito (cascade de logs). Solo el trainer dueño.

### `GET /habits/today?date=YYYY-MM-DD` (client)

Hábitos del cliente autenticado con `is_completed` para esa fecha exacta.

```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "Beber 2L de agua", "is_completed": false }
  ]
}
```

### `POST /habits/:id/toggle` (client)

Body: `{ "date": "2026-07-15", "completed": false }`.  
- Con `completed` (boolean): fuerza ese estado (idempotente; recomendado por el cliente).  
- Sin `completed`: si existe el log, lo borra (`completed: false`); si no, lo inserta (`completed: true`).  
La comparación de `logged_date` usa `DATE(...)` para evitar fallos de coerción en TiDB/MySQL.

```json
{
  "success": true,
  "data": { "completed": false, "date": "2026-07-15" }
}
```

## Check-in semanal y fotos de progreso (Feature 033)

Tablas `weekly_checkins` + `progress_photos`. Fotos opcionales (JPG/PNG, máx. 5 MB). Almacenamiento local en `backend/public/uploads/photos`, servido en `/uploads/photos/...` (**requiere JWT** Bearer o `?token=`; catálogo `/uploads/exercises` sigue público).

### `POST /checkins` (client)

`multipart/form-data`. Campos: `sleep_quality`, `stress_level`, `diet_adherence` (enteros 1–5), `notes` (opcional), `created_at` (opcional, `YYYY-MM-DD`; por defecto hoy local). Archivos opcionales: `front`, `side`, `back`.

Respuesta (`201`):

```json
{
  "success": true,
  "message": "Check-in registrado",
  "data": {
    "id": 1,
    "client_id": 5,
    "created_at": "2026-07-15",
    "sleep_quality": 4,
    "stress_level": 2,
    "diet_adherence": 5,
    "notes": "Me siento bien",
    "photos": [
      {
        "id": 1,
        "client_id": 5,
        "checkin_id": 1,
        "image_url": "/uploads/photos/client_5_front_….jpg",
        "pose_type": "front",
        "taken_at": "2026-07-15"
      }
    ]
  }
}
```

### `GET /checkins/client/:clientId` (trainer | client)

Historial cronológico con fotos asociadas. Trainer: solo alumnos propios. Client: solo su propio `clientId`. Incluye `reviewed_at` (`null` = pendiente de revisión).

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_id": 5,
      "created_at": "2026-07-15",
      "sleep_quality": 4,
      "stress_level": 2,
      "diet_adherence": 5,
      "notes": null,
      "reviewed_at": null,
      "photos": []
    }
  ]
}
```

### `PATCH /checkins/:id/review` (trainer)

Marca `reviewed_at = NOW()` si el check-in pertenece a un alumno del trainer. Idempotente si ya estaba revisado. Baja el KPI `pendingTasks.unreviewedCheckins` del dashboard (Feature 035).

## Mensajería interna (Feature 034)

Tabla `messages`. Transporte en tiempo real: **SSE** (`text/event-stream`), sin Socket.io. Conexiones en memoria (`sseManager` Map `userId → res`).

Ownership: client solo con su entrenador (`usuarios.trainer_id`); trainer solo con alumnos propios.

### `GET /messages/stream` (trainer | client)

Suscripción SSE. Auth: `Authorization: Bearer` **o** query `?token=<jwt>` (EventSource no puede enviar headers).

Headers de respuesta: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

Eventos: `data: <JSON mensaje>\n\n`. Comentarios de heartbeat periódicos.

### `GET /messages/partner` (client)

Devuelve el entrenador asignado como único partner de chat.

```json
{
  "success": true,
  "data": {
    "id": 2,
    "nombre": "Coach",
    "username": "coach",
    "rol": "trainer",
    "foto_url": "/uploads/avatars/2.webp",
    "telefono": "+57 300 123 4567",
    "is_online": false
  }
}
```

`telefono` viene de `trainers_info` (puede ser `null` si el entrenador no lo configuró). El cliente lo usa para CTA de WhatsApp al renovar membresía.

### `GET /messages/unread-summary` (trainer | client) — Feature 073

Resumen de DMs no leídos (`receiver_id = req.user.id` AND `is_read = FALSE`). Ownership: cliente solo su trainer asignado; trainer solo alumnos propios. Montado **antes** de `/:partnerId`.

```json
{
  "success": true,
  "data": {
    "total": 3,
    "byPartner": [
      {
        "partnerId": 12,
        "count": 3,
        "lastMessageAt": "2026-07-27T20:00:00.000Z",
        "preview": "¿Puedes revisar mi…"
      }
    ]
  },
  "message": "Resumen de mensajes no leídos"
}
```

- Cliente: `byPartner` longitud 0–1.
- Trainer: un ítem por alumno con no leídos.
- `preview`: hasta 80 caracteres del último mensaje no leído entrante.

### `GET /messages/presence/:partnerId` (trainer | client)

Presencia real del interlocutor: `isOnline = true` solo si tiene una conexión SSE abierta (stream de chat). Ownership igual que el resto del módulo.

```json
{
  "success": true,
  "data": { "partnerId": 12, "isOnline": true },
  "message": "Presencia del contacto"
}
```

También se incluye `is_online` en el `partner` de `GET /messages/:partnerId` y `GET /messages/partner`.

### `GET /messages/:partnerId` (trainer | client)

Historial cronológico. Marca `is_read = TRUE` los mensajes no leídos donde el usuario autenticado es el receptor.

```json
{
  "success": true,
  "data": {
    "partner": {
      "id": 5,
      "nombre": "Alumno",
      "username": "alumno",
      "rol": "client",
      "foto_url": "/uploads/avatars/5.webp"
    },
    "messages": [
      {
        "id": 1,
        "sender_id": 2,
        "receiver_id": 5,
        "content": "Hola",
        "is_read": true,
        "created_at": "2026-07-15T19:00:00.000Z"
      }
    ]
  }
}
```

### `POST /messages` (trainer | client)

Body: `{ "receiverId": 5, "content": "Texto" }`. Persiste y, si el destinatario está conectado al stream, empuja el mensaje por SSE.

```json
{
  "success": true,
  "data": {
    "id": 2,
    "sender_id": 2,
    "receiver_id": 5,
    "content": "Texto",
    "is_read": false,
    "created_at": "2026-07-15T19:01:00.000Z"
  },
  "message": "Mensaje enviado"
}
```



## Modo sombra (Feature 076)

Telemetría y cues **efímeros en Redis** (sin historial MySQL). Requiere `REDIS_URL` (`rediss://`). Sin Redis → `503`.

Preferencia opt-in en MySQL (`client_notification_settings.shadow_mode_enabled`, default `true`).

### `PATCH /me/workout-live` (client)

Upsert snapshot (TTL 45s). Throttle recomendado en FE: cambio de fase/serie o cada ≥5s.

Body:

```json
{
  "phase": "working",
  "exerciseName": "Press banca",
  "exerciseIndex": 2,
  "setIndex": 1,
  "routineName": "Push A",
  "restEndsAt": null
}
```

Respuesta: `{ success, data: { ok, cue } }`. Si hay `pendingCue`, se devuelve y se limpia del documento Redis.

### `DELETE /me/workout-live` (client)

Quita presencia live (fin / salir del player).

### `GET /trainer/live-sessions` (trainer)

Lista alumnos propios con live fresco. Poll recomendado ~8s; pausar si la pestaña no es visible.

### `POST /trainer/live-sessions/:clientId/cues` (trainer)

Body: `{ "body": "string ≤120", "tone": "tip|form|motivation|stop" }`. Rate-limit 1 cue / 10s por alumno. `429` si se excede. `403` si sombra off o no ownership. `404` si no hay live.

### `GET /me/settings/shadow-mode` (client)

`{ shadow_mode_enabled: boolean }`

### `PATCH /me/settings/shadow-mode` (client)

Body: `{ "shadow_mode_enabled": true|false }`
