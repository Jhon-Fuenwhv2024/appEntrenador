# Flujos de datos

## Login y sesión

1. Frontend `POST /login` → backend valida bcrypt y firma JWT.
2. Frontend guarda `token` + user en `localStorage` (`shared/auth/session.js`).
3. Axios envía `Authorization: Bearer` en cada request.
4. Middleware pobla `req.user`; roles restringen endpoints.
5. Ante `401`, el interceptor limpia sesión y redirige al login.

## Invitación → cliente del trainer (Feature 023)

1. Trainer autenticado `POST /api/invites` (o alias `POST /generate-token`) → fila en `invitaciones` con `trainer_id` y `status=pending`.
2. En Alumnos puede listar (`GET /api/invites`) y revocar pendientes (`PATCH /api/invites/:id/revoke` → `revoked`).
3. Cliente abre `/registro?token=...`: el frontend limpia cualquier sesión previa (`clearSession`) para no heredar el JWT del trainer.
4. `POST /register` llama a `invitesService.validateAndConsumeToken` (transacción): marca `used` y crea `usuarios` con `rol=client` y `trainer_id` del invite.
5. Tras éxito se vuelve a limpiar sesión y se redirige a `/` (login) para que el cliente inicie sesión con su cuenta.
6. Trainer ve al alumno en `GET /clients` (filtrado por ownership) en `/trainer/clients`.

## Perfil alumno y avatar (Feature 020)

1. Cliente abre `/client/profile` o trainer la sección Perfil en `/trainer/clients/:id`.
2. `GET /profile/:userId` con ownership (client = propio; trainer = alumno suyo).
3. Al guardar: `PUT /profile/:userId` con `FormData` (texto + opcional `foto`).
4. Multer guarda en `backend/public/uploads/avatars`; Express sirve `/uploads`.
5. Upsert en `alumnos_info`; si `foto_url` es null, la UI usa `src/assets/foto_perfil.png`.

## Ajustes de cuenta del trainer (Feature 024)

1. Trainer abre `/trainer/settings`.
2. `GET /me/account` carga nombre + `trainers_info` (teléfono/foto).
3. Editar perfil: `PUT /me/account` (FormData); se renueva el JWT con el nuevo nombre.
4. Cambiar contraseña: `POST /me/password` con password actual; la sesión no se cierra.
5. Avatar por defecto igual que alumnos si no hay `foto_url`.

## Asignación y lectura de rutinas

1. Trainer abre la lista en `/trainer/clients` (o CTA desde Inicio) y entra a `/trainer/clients/:id` (ficha 360) para crear/editar rutinas vía API en la sección Programación.
2. Service valida ownership trainer↔cliente en cada escritura.
3. Cliente autenticado `GET /me/routines` y el portal muestra plan del día / semana (con media del catálogo si hay match por nombre).

## Ficha 360 del alumno (Feature 039)

1. Trainer abre `/trainer/clients/:clientId` → `Client360View` carga `GET /clients/:id/overview` (perfil + última sesión + conteos + último check-in + nutrition targets + membresía 040 + slots 041–042).
2. Cabecera sticky muestra avatar/objetivo/última sesión y badge de membresía (días restantes / Pendiente / Vencida); navegación por `?tab=` (Resumen · Programación · Nutrición & Hábitos · Medidas · Check-ins · Gráficas · Chat).
3. Resumen monta `MembershipPanel` (PUT membresía) + `ConsistencyPanel` (meta semanal 042) + widgets de decisión (incl. PRs del mes 041) + historial de sesiones (`GET /clients/:id/workout-sessions`).
4. Overview incluye `consistencyScore` y `prsThisMonth` calculados en server.
5. Programación reutiliza CRUD de rutinas; paneles existentes (nutrición, hábitos, body-comp, check-ins, gráficas, perfil, chat) se montan por sección sin perder CRUD.
6. Ownership: el overview y cada panel validan `trainer_id` del alumno.

## Membresía y control de pago (Feature 040)

1. Trainer en ficha 360 guarda estado/fechas/notas/bloqueo → `PUT /clients/:id/membership` (upsert en `client_memberships`).
2. Lista de alumnos (`GET /clients`) trae `membership` básico; la UI filtra localmente Al día / Por vencer / Vencidos / Pendientes.
3. Cliente consulta `GET /me/membership` → `days_remaining` calculado; sin `notes`.
4. Si el trainer activó `block_on_unpaid` y la membresía no está al día, `GET /me/routines`, `GET /me/today` y `POST /me/workout-sessions` responden 403 `MEMBERSHIP_BLOCKED`.

## Dashboard immersivo del cliente (Feature 038)

1. Cliente en Inicio (`ClientDashboardView`) llama `GET /me/today?date=YYYY-MM-DD` (fecha civil local del dispositivo).
2. El service agrega en paralelo: rutinas del alumno → match por `dia_semana`, hábitos de `/habits/today`, `nutrition_targets` (o `null`), y membresía (040).
3. Si no hay rutina para ese weekday, `todayRoutine = null` → UI “Día de descanso”; si hay, hero + CTA **Empezar** → `/client/workout/:routineId`.
4. Hábitos y macros se hidratan desde la misma respuesta (sin round-trips extra); el toggle de hábitos sigue siendo `POST /habits/:id/toggle`.
5. Meta bajo el saludo (“N días restantes”); si `membershipBlocked`, hero con CTA Bloqueado (Player también responde 403 `MEMBERSHIP_BLOCKED`).
6. Perfil cliente (`/client/profile`): `ProfileFormCard` (datos/foto) y debajo un resumen compacto de membresía (`GET /me/membership`: días, Al día/Debe, vigencia).

## Plantillas → deep copy al alumno (Feature 018)

1. Trainer crea/edita plantillas en `/trainer/library` (`POST/PATCH /templates`) o guarda una rutina existente con “Guardar en Biblioteca”.
2. Al asignar (`POST /templates/:id/assign` con `clientId` + `dia_semana?`):
   - Valida plantilla propia (`trainer_id = req.user.id`) y ownership del alumno.
   - En una transacción inserta una **nueva** fila en `rutinas` y copia cada línea a `ejercicios`.
   - No se guarda FK hacia `routine_templates`: la copia es independiente.
3. Editar o borrar la plantilla después **no** cambia las rutinas ya asignadas.

## Ejecución de rutina (Workout Player)

1. Cliente pulsa **Empezar** en el hero del dashboard → `/client/workout/:routineId`.
2. Frontend carga `GET /me/routines` (incluye `last_log` por ejercicio si hay historial) y muestra **Comenzar entrenamiento**.
3. En ese tap se desbloquea el audio HTML5 (`useTimer.unlockAudio`) y arranca `useWorkoutSession` (serie, descanso, auto-avance).
4. El descanso usa `targetEndTime` (wall clock) + `visibilitychange`: al volver del background se recalcula `targetEndTime - Date.now()`; si ya expiró, contador a 0, beep y avance de serie. No se confía en ticks que resten `1` cada segundo.
5. El Player muestra “Último: X kg × Y” de forma informativa; **no** autocompleta los inputs con ese historial.
6. Al terminar, `POST /me/workout-sessions` persiste peso/reps por serie.
7. Tras guardar (status `completed`): detección de PRs (041) → `new_prs[]` + notificación `pr_achieved`; recalculo de racha/score (042) → `consistency` en la respuesta; Player muestra overlay si hay PRs.
8. En la siguiente sesión, ese log queda disponible como `last_log` (match por `client_id` + nombre de ejercicio; los ids de línea de deep copy no afectan).
9. Trainer consulta `GET /clients/:id/workout-sessions` y ve el historial en la ficha del alumno; `GET /clients/:id/routines` también incluye `last_log` por ejercicio.
10. Cliente consulta `GET /me/workout-sessions` en **Mi progreso** (`/client/progress`) — Feature 021; sección **Mis récords** vía `GET /me/personal-records`.

## PRs y celebraciones (Feature 041)

1. Al cerrar sesión completed, service compara el mejor peso por ejercicio vs máximo histórico (`personal_records` + `workout_set_logs` previos).
2. Si supera → insert en `personal_records` y se devuelve en `new_prs`.
3. Overlay en Workout Player; listado en Progreso; chip “PRs este mes” en Ficha 360.

## Rachas y score (Feature 042)

1. `client_streaks` guarda `week_goal` y cachea `current_streak` / `best_streak`.
2. Días con entreno = fechas UTC de sesiones `completed`. Score = `workouts_this_week / week_goal * 70 + min(current_streak, 10) * 3` (cap 100).
3. Cliente: widget en Inicio (`GET /me/consistency`); mejor racha en Progreso.
4. Trainer: chip en cabecera 360 + editor de meta en `ConsistencyPanel`.

## Memoria de progresión (Feature 019)

1. Al listar rutinas del cliente, el service consulta el último `workout_set_logs` del alumno por **nombre exacto** del ejercicio (`JOIN workout_sessions` filtrando `client_id`).
2. No se usa `ejercicios.id` / `exercise_id` de la línea actual: al reasignar plantillas (018) esos ids cambian y el historial se perdería.
3. Payload: `ejercicios[].last_log = { weight, reps, date } | null`.
4. UI: hint en Workout Player; sin prefill de inputs.

## Composición corporal (Feature 026)

1. Trainer abre la ficha del alumno (`/trainer/clients/:id`) → panel **Composición corporal**.
2. Al abrir el modal de nueva medición, el frontend toma el último log (si existe) y pre-llena solo `height_cm`; peso y circunferencias quedan vacíos.
3. `POST /clients/:clientId/body-composition` (o `PUT .../:logId`): el service calcula `bmi = weight_kg / (height_cm/100)²` y persiste; ignora cualquier `bmi` del body.
4. Ownership: trainer solo alumnos con `usuarios.trainer_id = req.user.id`; `recorded_by` = trainer autenticado.
5. Cliente en **Mi progreso** (`/client/progress`) llama `GET /me/body-composition` — solo lectura, sin UI de escritura.

## Objetivos nutricionales (Feature 031)

1. Trainer en la ficha del alumno (`NutritionTargetsPanel`) carga `GET /nutrition/:clientId` (404 = formulario vacío).
2. Al editar macros (g), el frontend recalcula calorías con factores Atwater (FDA 21 CFR 101.9): P×4 + C×4 + F×9 kcal; el trainer puede sobrescribir `calories` a mano.
3. `PUT /nutrition/:clientId` hace UPSERT 1:1 (`UNIQUE client_id`); solo trainer dueño; valida enteros positivos.
4. Cliente en dashboard ve macros vía `GET /me/today` (campo `macros`) o, si se usa el card suelto, `GET /nutrition/:clientId`; sin targets → no se muestra la capa secundaria.

## Check-in semanal y fotos (Feature 033)

1. Cliente en **Mi progreso** abre el modal **Hacer Check-in Semanal** (`WeeklyCheckinDialog`).
2. Envía `POST /checkins` como `multipart/form-data` (ratings 1–5 + notas; fotos `front`/`side`/`back` opcionales, ≤5 MB).
3. Backend (transacción): inserta `weekly_checkins` y, si hay archivos, filas en `progress_photos` con `image_url` bajo `/uploads/photos/…`.
4. Trainer en la ficha del alumno (pestaña **Check-ins**) carga `GET /checkins/client/:clientId` y ve timeline + miniaturas ampliables.
5. `reviewed_at` queda `NULL` al crear (cola “sin revisar” del dashboard 035).

## Dashboard analítico del trainer (Feature 035)

1. Trainer abre Inicio (`TrainerDashboardView`) → `GET /trainer/dashboard` (JWT + rol trainer).
2. Service agrega en queries set-based (filtradas por `req.user.id`):
   - stats 015 (conteos + serie mensual);
   - `retention` (activos 14d / inactivos / %);
   - `pendingTasks` (check-ins `reviewed_at IS NULL` + alumnos sin `nutrition_targets`);
   - `weekProgress` (sesiones lun–dom + `byDay` + vs semana anterior).
3. UI: fila compacta de 5 KPIs + hub (actividad mensual pequeña + acciones). El pill de perfil muestra `saas_plan` (FREE/PRO), no el rol.
4. Definiciones de negocio: [ADR-0003](decisions/ADR-0003-trainer-dashboard-metrics.md).

## Visualización de progreso / gráficas (Feature 027)

1. Cliente (pestaña **Gráficas** en Mi progreso) o trainer (pestaña **Gráficas** en la ficha) llama:
   - `GET /progress/metrics/:clientId` → peso + IMC ASC.
   - `GET /progress/exercises/:clientId` → lista de ejercicios con logs; luego `?exerciseId=` / `?exerciseName=` → MAX(weight) por día.
2. Ownership en service: client solo su id; trainer vía `getClientOwnedByTrainer`.
3. UI: `ProgressChartsPanel` + `ProgressLineChart` (chart.js / vue-chartjs). Si hay menos de 2 puntos, se oculta el canvas y se muestra mensaje de datos insuficientes.
4. Fuerza se agrupa por `exercise_name` (misma regla que Feature 019), no por `ejercicios.id` efímero.

## Mensajería interna SSE (Feature 034)

1. Cliente abre `/client/messages` → `GET /messages/partner` resuelve el trainer asignado; trainer abre `/trainer/messages` y elige alumno de `GET /clients`.
2. `GET /messages/:partnerId` carga historial cronológico y marca `is_read = TRUE` los mensajes donde el usuario actual es receptor.
3. Al montar el chat, el frontend abre `EventSource` a `/api/messages/stream?token=<JWT>` (EventSource no admite header `Authorization`).
4. `POST /messages` persiste en MySQL; si el `receiver_id` tiene conexión SSE en el `Map` in-memory, el servidor hace `res.write('data: …\n\n')`.
5. Al desmontar la vista, `eventSource.close()` elimina fugas; el backend limpia el Map en `req.on('close')`.
6. Ownership estricto: client solo con su `trainer_id`; trainer solo con alumnos propios.
