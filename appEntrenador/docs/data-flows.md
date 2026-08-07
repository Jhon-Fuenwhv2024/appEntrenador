# Flujos de datos

## Login y sesión

1. Frontend `POST /login` → backend valida bcrypt, firma **access JWT** corto y emite **refresh** opaco (hash en `refresh_tokens`).
2. Credenciales inválidas → error **inline** en el campo correspondiente: usuario inexistente (`404`) o contraseña incorrecta (`401`, mensaje específico solo en ese caso).
3. Respuesta exitosa incluye `user` + `token` + `refreshToken` (Feature 083).
4. Frontend guarda sesión en `localStorage` (`setSession` / `shared/auth/session.js`) y navega al dashboard según rol.
5. Axios envía `Authorization: Bearer` (access) en cada request; el middleware pobla `req.user` y los roles restringen endpoints.
6. Ante `401` en rutas protegidas: el interceptor intenta **un** `POST /auth/refresh` (single-flight), actualiza tokens y reintenta la request. Si el refresh falla → limpia sesión y redirige al login.
7. **Cerrar sesión** → `POST /auth/logout` (Bearer y/o `refreshToken`) revoca refreshes en servidor y luego limpia `localStorage`.

## Invitación → cliente del trainer (Feature 023)

1. Trainer autenticado `POST /api/invites` (o alias `POST /generate-token`) → fila en `invitaciones` con `trainer_id` y `status=pending`.
2. En Alumnos puede listar (`GET /api/invites`) y revocar pendientes (`PATCH /api/invites/:id/revoke` → `revoked`).
3. Cliente abre `/registro?token=...`: el frontend limpia cualquier sesión previa (`clearSession`) para no heredar el JWT del trainer.
4. `POST /register` llama a `invitesService.validateAndConsumeToken` (transacción): marca `used` y crea `usuarios` con `rol=client` y `trainer_id` del invite.
5. Tras éxito se vuelve a limpiar sesión y se redirige a `/` (login) para que el cliente inicie sesión con su cuenta.
6. Trainer ve al alumno en `GET /clients` (filtrado por ownership) en `/trainer/clients` (lista con `foto_url` / avatar por defecto).
7. Eliminar alumno (`DELETE /clients/:id`): desvincula (`trainer_id = NULL`) e inhabilita dietas activas del par; la cuenta del alumno permanece.

## Perfil alumno y avatar (Feature 020)

1. Cliente abre `/client/profile` o trainer la sección Perfil en `/trainer/clients/:id`.
2. `GET /profile/:userId` con ownership (client = propio; trainer = alumno suyo).
3. Al guardar: `PUT /profile/:userId` con `FormData` (texto + opcional `foto`).
4. Multer recibe `foto` (máx. 2 MB). Si hay env R2 → sube a Cloudflare R2 (`avatars/user_{id}.*`); si no → disco `backend/public/uploads/avatars`.
5. Express sirve `/uploads/avatars/...` con JWT (`Bearer` o `?token=`): proxy R2 o `express.static` local. La DB guarda solo la ruta relativa en `alumnos_info.foto_url`.
6. La UI **no** embebe el access JWT en `<img src>`: carga el avatar con `fetch` + `Authorization: Bearer` (refresco ante 401) y muestra un blob URL (`useAuthenticatedAvatar` / `TfAvatar`). Si falla, iniciales o asset por defecto.
7. Si `foto_url` es null, la UI usa `src/assets/foto_perfil.png` o iniciales según el componente.

Ver ADR-0004, ADR-0005 y `docs/deploy-render.md` (sección R2).

## Media de ejercicios (catálogo Fitcron + trainer)

1. DB guarda solo metadatos/URLs (`media_url`, `local_media_path`, `media_type`); sin binarios en TiDB.
2. Catálogo Fitcron: `local_media_path` = `/uploads/exercises/exercise_{id}.gif`.
3. Trainer (Feature 090): en el formulario del catálogo puede **enlazar URL** (`media_url`) o **subir archivo** (`media_file` vía multipart). Upload → `local_media_path` = `/uploads/exercises/trainer_{trainerId}_{uuid}.{ext}` (máx. 10 MB; jpeg/png/webp/gif/mp4/webm). Solo ejercicios privados del trainer.
4. Con env R2 → binarios en Cloudflare R2 prefijo `exercises/`; Express proxy público en `GET /uploads/exercises/...` (fallback disco; sirve GIFs Fitcron y media de trainer).
5. Sin R2 → disco `backend/public/uploads/exercises`.
6. Migración inicial del catálogo a R2 ya aplicada (prefijo `exercises/`); el scraper sube GIFs nuevos si R2 está configurado.

## Ajustes de cuenta del trainer (Feature 024)

1. Trainer abre `/trainer/settings`.
2. `GET /me/account` carga nombre + `trainers_info` (teléfono/foto).
3. Editar perfil: `PUT /me/account` (FormData); avatar usa la misma capa R2/local que el perfil alumno; se renueva el JWT con el nuevo nombre.
4. Cambiar contraseña: `POST /me/password` con password actual; la sesión no se cierra.
5. Avatar por defecto igual que alumnos si no hay `foto_url`.

## Asignación y lectura de rutinas

1. Trainer abre la lista en `/trainer/clients` (o CTA desde Inicio) y entra a `/trainer/clients/:id` (ficha 360) para crear/editar rutinas vía API en la sección Programación.
2. Service valida ownership trainer↔cliente en cada escritura.
3. Cliente autenticado `GET /me/routines` y el portal muestra plan del día / semana (con media del catálogo si hay match por nombre).

## Ficha 360 del alumno (Feature 039)

1. Trainer abre `/trainer/clients/:clientId` → `Client360View` carga `GET /clients/:id/overview` (perfil + última sesión + conteos + último check-in + nutrition targets + membresía 040 + slots 041–042).
2. Cabecera sticky muestra avatar/objetivo/última sesión y badge de membresía (días restantes / Pendiente / Vencida); navegación por `?tab=` (Resumen · Programación · Nutrición & Hábitos · Medidas · Check-ins · Gráficas · Chat).
3. Resumen (Feature 060): `MembershipPanel` en **vista** por defecto (Editar abre formulario) + `ConsistencyPanel` strip compacto (meta bajo demanda) + widgets de decisión (incl. PRs del mes 041) + historial agrupado por día con `GET /clients/:id/workout-sessions?limit=&offset=` y «Ver más».
4. Overview incluye `consistencyScore` y `prsThisMonth` calculados en server.
5. Programación (Feature 061): vista semanal L–D + builder bajo demanda + **Desde Recursos** (`POST /templates/:id/assign` con `clientId` fijo) + duplicar a otro día vía `POST /clients/:id/routines`. Paneles existentes (nutrición, hábitos, body-comp, check-ins, gráficas, perfil, chat) se montan por sección sin perder CRUD.
6. Ownership: el overview y cada panel validan `trainer_id` del alumno.

## Programación 360 (Feature 061 + 084)

1. Trainer abre `?tab=programacion` → `Client360Programming` carga `GET /clients/:id/routines` y muestra strip semanal (`ProgrammingWeekBoard`).
2. Día vacío → crear (abre `RoutineDayBuilder`) o asignar plantilla (`ProgrammingAssignTemplateDialog` → `POST /templates/:id/assign`).
3. Día con rutina → editar en builder, duplicar a otro día (create con mismos ejercicios), guardar en Recursos (`POST /templates`), eliminar.
4. El builder solo aparece al crear/editar (progressive disclosure: Grupo/indicaciones colapsables; reorder de ejercicios).
5. **Preview en vivo (084):** al abrir el builder, split desktop (editor izquierda / preview derecha) o preview colapsable en móvil. El draft se adapta con `routineDraftPreviewAdapter` + media del catálogo (`WorkoutExerciseMedia`); thumb compacto por fila en el editor. Sin guardar obligatorio ni llamadas `/me/*`.
6. **Prescripción por serie (085):** opcional `set_prescription` JSON en `ejercicios` / `template_exercises`. El builder tiene “Personalizar por serie” (Serie | Reps | Kg). El player prellena peso/reps según el nº de serie; preview muestra label variable (`12×40 · 10×45`).

## Densidad Resumen 360 (Feature 060)

1. Trainer abre Resumen → membresía y consistencia ocupan poco espacio (estado legible, no formularios permanentes).
2. Historial Resumen: solo **Hoy** y **Ayer** visibles (columnas); estados Completada vs Sin completar (`abandoned`); días anteriores colapsados. Carga inicial ~12 sesiones.
3. Portal cliente `GET /me/workout-sessions` sigue devolviendo **array** (máx. 50) para no romper Progreso 021.

## Rutina programada de hoy en Actividad reciente (Feature 066)

1. En Resumen, `Client360View` carga en paralelo `GET /clients/:id/workout-sessions` y `GET /clients/:id/routines`.
2. `Client360RecentSessions` resuelve el weekday local (`es-ES` long → `Lunes`…`Domingo`, misma convención que `useClientToday` / `getTodayBundle`).
3. En el bucket **Hoy**, si hay rutina(s) con ese `dia_semana` y aún no hay sesión de hoy asociada (`routine_id`, o mismo nombre si la sesión no trae id), se inserta fila sintética `kind: 'planned'` con badge **Pendiente** (solo UI; no crea `workout_sessions`).
4. Si ya hay sesión de esa rutina hoy → solo la sesión real (sin duplicar Pendiente). Empty «Sin entrenamientos hoy» solo sin sesión ni rutina programada.
5. Ayer / días anteriores siguen basados solo en sesiones reales.

## Membresía y control de pago (Feature 040 + 079 + 080)

1. Trainer en ficha 360 guarda estado/fechas/notas/bloqueo/tipo/monto → `PUT /clients/:id/membership` (upsert en `client_memberships`; snapshot `plan_price` desde tipo 079).
2. **Reglas 080:** con `plan_price`, el service rechaza sobrepago (`amount_paid > plan_price`), fuerza `active` si pagó completo y periodo vigente, `owing` si hay saldo, y `expired` si `period_end < hoy` (prioridad sobre pago). Sin precio, el estado sigue siendo manual (040).
3. Al **leer** membresía, si `period_end < hoy` y status no es `expired`, se auto-actualiza a `expired` en DB.
4. **Soft-lock:** `block_on_unpaid` bloquea rutinas solo si el periodo terminó **y** pasaron **3 días de gracia** (`days_remaining < -3`). `owing` (pendiente/abono) con periodo vigente **no** bloquea.
5. Lista de alumnos (`GET /clients`) trae `membership` básico; la UI filtra localmente Al día / Por vencer / Vencidos / Pendientes.
6. Cliente consulta `GET /me/membership` → `days_remaining`, `amount_due`, nombre de tipo; sin `notes`.
7. Catálogo de tipos: trainer en **Recursos → Membresías** (`/trainer/library/memberships`) CRUD vía `/trainer/membership-types`.
8. Si aplica soft-lock, `POST /me/workout-sessions` (y guards) responden 403 `MEMBERSHIP_BLOCKED`.

## Membresía del gym físico (Feature 082)

1. Cliente en `/client/profile` (sección Gym) guarda nombre opcional + `expires_on` + `notify_enabled` → `PUT /me/gym-membership` (upsert en `client_gym_memberships`).
2. `GET /me/gym-membership` devuelve fila o `null` con `days_remaining` calculado.
3. `DELETE /me/gym-membership` borra la fila (deja de avisar).
4. Job diario (hora 9, TZ del alumno): si `notify_enabled` y `days_remaining` ∈ {7,3,1,0} → notificación `gym_membership_expiring` / `gym_membership_expired` → `/client/profile` (+ push 051). Independiente de `client_memberships` (040).

## Dashboard immersivo del cliente (Feature 038 + 083)

1. Cliente en Inicio (`ClientDashboardView`) llama `GET /me/today?date=YYYY-MM-DD` (fecha civil local del dispositivo).
2. El service agrega en paralelo: rutinas → match `dia_semana`, hábitos, `nutrition_targets`, membresía (040), consistencia (042), check-in due (033), chat preview (073), resumen dieta + adherencia (043/083).
3. `todayCompleted` compara `finished_at` en la timezone del alumno (default `America/Bogota`), no `DATE()` UTC de MySQL.
4. `useClientHomeMode` deriva modo: `membershipCritical` | `postWorkout` | `restDay` | `reengage` | `activeDay` → copy del hero; CTA de inicio siempre **Empezar** (no “Retomar”); tras completar → badge **Completado** (sin Repetir: no se reentrena la misma rutina el mismo día).
5. Fila `HomeDayActions`: agua one-tap, kcal plan/meta, chip check-in, chip chat; insight de 1 línea (`weekInsight`).
6. Hábitos y macros se hidratan desde la misma respuesta; toggle hábitos `POST /habits/:id/toggle`.
7. Dieta compacta: próxima comida + Comí/No comí (`PUT /me/diet-meals/:mealId/adherence`) → refresca bundle; expandir muestra strip L–D + lista.
8. Macros card: barras planificado/eaten vs objetivo.
9. Meta bajo el saludo; si `membershipBlocked` / crítico ≤3 días → banner contacto entrenador.
10. Digest email semanal (lunes ~09:00 TZ alumno) vía notification-jobs + Resend/mailer — distinto del informe trainer (**052**).
11. Perfil / shopping-list sin cambio de flujo respecto a 082 / 071.

## Planes de dieta (Feature 043 + 064 ciclo)

1. Trainer en ficha 360 (Nutrición) abre `DietPlanPanel` → `DietPlanForm` con tabs Semana 1…N + strip L–D + builder por día.
2. La UI calcula macros del día y media del ciclo en vivo (`computed`).
3. Al guardar: `POST/PUT /trainer/diets` con `days[]` → service valida ownership, recalcula desde items, escribe en transacción (nested replace de `diet_plan_days`).
4. Activar (o guardar activo): desactiva otros planes del cliente y sincroniza **media del ciclo** → `nutrition_targets` (031). Inhabilitar: `POST /trainer/diets/:id/deactivate` (`is_active = 0`) sin borrar el plan.
5. Cliente: `GET /me/diet-plan?date=` resuelve `week_index` + `dia_semana` desde `cycle_start_date` / `cycle_length_weeks`; sin fallback si el día está vacío. Strip semanal vía `/me/diet-plan/week`.
6. Duplicar día/semana: en el form (estado local) y endpoints `POST .../copy-day` | `copy-week`.
7. Feature **057**: jerarquía comida/productos en `ClientDietView` se mantiene sobre el día resuelto.
8. Feature **069**: al escribir un alimento en `DietPlanForm`, blur/debounce o botón “Autocompletar” llama `GET /trainer/foods/lookup` (USDA → OFF) y rellena kcal/P/C/G si estaban en 0; reescala con `per_100g` al cambiar cantidad en g/ml.
9. Feature **071**: `GET /me/diet-plan/shopping-list` agrega todos los ítems del ciclo por nombre normalizado (quita `(Sn)`) + unidad, clasifica por macro dominante y alimenta `ClientShoppingListView` (`/client/shopping-list`).

## Plantillas → deep copy al alumno (Feature 018)

1. Trainer crea/edita plantillas en `/trainer/library` (hub **Recursos**; `POST/PATCH /templates`) o guarda una rutina existente con “Guardar en Recursos”.
2. Al asignar (`POST /templates/:id/assign` con `clientId` + `dia_semana?`):
   - Desde Recursos: dialog elige alumno + día (`AssignTemplateDialog`).
   - Desde Programación 360 (Feature 061): dialog elige plantilla + día con alumno fijado (`ProgrammingAssignTemplateDialog`).
   - Valida plantilla propia (`trainer_id = req.user.id`) y ownership del alumno.
   - En una transacción inserta una **nueva** fila en `rutinas` y copia cada línea a `ejercicios`.
   - No se guarda FK hacia `routine_templates`: la copia es independiente.
3. Editar o borrar la plantilla después **no** cambia las rutinas ya asignadas.
4. Desde el Catálogo (Recursos), el trainer puede **añadir un ejercicio** a una plantilla existente o a una rutina de alumno (`AssignCatalogExerciseDialog` → `PATCH /templates/:id` o `PUT /routines/:id` con la línea al final).

## Ejecución de rutina (Workout Player)

1. Cliente pulsa **Empezar** en el hero del dashboard → `/client/workout/:routineId` (solo si la rutina es del `dia_semana` de hoy).
   - Feature **058**: también puede pulsar **Ver rutina** → `/client/routine/:routineId` (preview solo lectura con lista completa + GIF/video vía `WorkoutExerciseMedia`); desde ahí **Empezar** entra al Player **solo si hoy es el día programado**.
   - Si el trainer asigna/actualiza una rutina (notif → preview) y hoy **no** es ese `dia_semana`: el alumno puede **ver** la rutina; Empezar queda deshabilitado (“Disponible {día}”). El Player y `POST /me/workout-sessions` rechazan inicio con `ROUTINE_DAY_LOCKED`.
   - Si ya completó esa rutina **hoy**: preview muestra **Completado** (Empezar deshabilitado); el Player no permite re-iniciar.
2. Frontend carga `GET /me/routines` (incluye `last_log` por ejercicio si hay historial) y muestra **Comenzar entrenamiento**.
3. En ese tap se desbloquea el audio HTML5 (`useTimer.unlockAudio`) y arranca `useWorkoutSession` (serie, descanso, auto-avance).
4. **Feature 059 (UX híbrida):** fase `working` = media del ejercicio + checklist de series (Set | Anterior | kg×reps | estado) + CTA Completar serie; header con duración de sesión. Fase `resting` = anillo de progreso, controles ±15 s, Omitir y bloque **Up next** (respeta superseries 029).
5. **Feature 087:** **Máquina ocupada** inserta el ejercicio activo justo después del siguiente (`execution_status: pospuesto`, solo frontend; ej. Press → Laterales queda Laterales → Press). Copy del CTA evita el skip genérico. En descanso, tap en **Siguiente ejercicio** abre ficha técnica (media / descripción / músculos) sin pausar el wall-clock; el media se desmonta al cerrar el dialog.
6. El descanso usa `targetEndTime` (wall clock) + `visibilitychange`: al volver del background se recalcula `targetEndTime - Date.now()`; si ya expiró, contador a 0, beep y avance de serie. No se confía en ticks que resten `1` cada segundo. `useTimer.adjust` mueve el deadline (±15) sin romper ADR-0002.
7. **Feature 086:** Screen Wake Lock mientras `working`/`resting` (`useWakeLock`); si el descanso termina con la app oculta y hay permiso de notificaciones, notificación local `rest_complete`. Si `POST /me/workout-sessions` falla por red, el payload va a IndexedDB (`offlineWorkoutQueue`) y se hace flush al evento `online` / montaje del shell (ADR-0009).
8. La columna **Anterior** del checklist usa `last_log` de forma informativa; **no** autocompleta los inputs con ese historial (inputs siguen el peso/reps prescritos de la rutina).
9. Al terminar, `POST /me/workout-sessions` persiste peso/reps por serie (contrato sin cambios); offline → cola local hasta sync.
10. Tras guardar (status `completed`): detección de PRs (041) → `new_prs[]` + notificación `pr_achieved`; recalculo de racha/score (042) → `consistency` en la respuesta; Player muestra overlay si hay PRs. (Si quedó en cola offline, PRs llegan al flush.)
11. Al volver a Inicio, `todayCompleted` debe ser `true` (fecha civil TZ alumno) → hero **Completado** (sin CTA Repetir) — tras sync si estaba offline.
12. En la siguiente sesión, ese log queda disponible como `last_log` (match por `client_id` + nombre de ejercicio; los ids de línea de deep copy no afectan).
13. Trainer consulta `GET /clients/:id/workout-sessions` y ve el historial en la ficha del alumno; `GET /clients/:id/routines` también incluye `last_log` por ejercicio.
14. Cliente consulta `GET /me/workout-sessions` en **Mi progreso** (`/client/progress`) — Feature 021; sección **Mis récords** vía `GET /me/personal-records`.

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
4. Trainer en la ficha del alumno (pestaña **Check-ins**) carga `GET /checkins/client/:clientId` y ve timeline + miniaturas ampliables (`?token=` en URLs de foto).
5. `reviewed_at` queda `NULL` al crear (cola “sin revisar” del dashboard 035).
6. Trainer pulsa **Marcar revisado** → `PATCH /checkins/:id/review` → `reviewed_at = NOW()`; el KPI de pendientes baja.

## Dashboard analítico del trainer (Feature 035)

1. Trainer abre Inicio (`TrainerDashboardView`) → `GET /trainer/dashboard` (JWT + rol trainer).
2. Service agrega en queries set-based (filtradas por `req.user.id`):
   - stats 015 (conteos + serie mensual);
   - `retention` (activos 14d / inactivos / %);
   - `pendingTasks` (check-ins `reviewed_at IS NULL` + alumnos sin `nutrition_targets`);
   - `weekProgress` (sesiones lun–dom + `byDay` + vs semana anterior).
3. UI: fila compacta de 5 KPIs + hub (actividad mensual pequeña + acciones). El pill de perfil muestra `saas_plan` (FREE/PRO), no el rol.
4. Definiciones de negocio: [ADR-0003](decisions/ADR-0003-trainer-dashboard-metrics.md).

## Visualización de progreso / gráficas (Feature 027 + 072)

1. Cliente en **Mi progreso** (`/client/progress`, single scroll Feature 072) o trainer (pestaña **Gráficas** en la ficha) llama:
   - `GET /progress/metrics/:clientId` → peso + IMC ASC.
   - `GET /progress/exercises/:clientId` → lista de ejercicios con logs; luego `?exerciseId=` / `?exerciseName=` → MAX(weight) por día.
2. Ownership en service: client solo su id; trainer vía `getClientOwnedByTrainer`.
3. UI: `ProgressChartsPanel` + `ProgressLineChart` (chart.js / vue-chartjs). En cliente, filtro **7/30/90** en frontend sobre las series ya cargadas; tendencia textual (sube/baja/estable). Si hay menos de 2 puntos, empty state motivador.
4. Fuerza se agrupa por `exercise_name` (misma regla que Feature 019), no por `ejercicios.id` efímero.
5. Hero cliente: `GET /me/consistency` (racha) + sesiones 7d + delta de peso desde `GET /me/body-composition` (último vs anterior).

## Mensajería interna SSE (Feature 034)

1. Cliente abre `/client/messages` → `GET /messages/partner` resuelve el trainer asignado; trainer abre `/trainer/messages` y elige alumno de `GET /clients`.
2. `GET /messages/:partnerId` carga historial cronológico y marca `is_read = TRUE` los mensajes donde el usuario actual es receptor.
3. Al montar el chat, el frontend abre `EventSource` a `/api/messages/stream?token=<JWT>` (EventSource no admite header `Authorization`).
4. `POST /messages` persiste en MySQL; si el `receiver_id` tiene conexión SSE en el `Map` in-memory, el servidor hace `res.write('data: …\n\n')`.
5. Al desmontar la vista, `eventSource.close()` elimina fugas; el backend limpia el Map en `req.on('close')`.
6. Ownership estricto: client solo con su `trainer_id`; trainer solo con alumnos propios.

## Indicadores de no leídos (Feature 073)

1. `AppShell` usa `useUnreadMessages` → `GET /messages/unread-summary` (poll 45s + `visibilitychange`); `AppBottomNav` e inbox comparten el mismo estado.
2. Badge numérico en tab Chat (móvil) y en el icono Mensajes de la sidebar desktop cuando `total > 0` (`n` / `99+`); `aria-label` incluye el contador.
3. Inbox trainer (`TrainerInboxView`) fusiona el summary con la lista de alumnos: preview, hora relativa, badge por fila; orden: no leídos primero, luego alfabético / `lastMessageAt`.
4. Al abrir un hilo, `GET /messages/:partnerId` marca leídos y `ChatThread` llama `refresh()` del summary para bajar el badge.
5. No hay fan-out SSE global ni tipo `new_message` en campana (074); el descubrimiento es poll + badge/inbox.

## Notificaciones efímeras y deep-links (Feature 074)

1. Al crear una notificación el servidor setea `expires_at = now + 30d` y, cuando aplica, `entity_type` / `entity_id` / `action_url` (paths internos: `/dashboard`, `/client/progress`, `/client/routine/:id`, `/trainer/clients/:id`).
2. `GET /notifications` ejecuta `purgeForUser(req.user.id)`: borra expiradas y leídas con más de 3 días; luego lista máx. 50 + `unreadCount`.
3. Activar o guardar un plan de dieta activo emite `diet_updated` al `client_id` del plan.
4. En UI (`NotificationBadge`): tap → mark read → dialog grande con detalle → CTA navega con `action_url` si es path relativo seguro; botón descartar → `DELETE /notifications/:id`.
5. Tipos sin `action_url` solo se marcan leídos y se muestran en el dialog (sin crash).

## Jobs de recordatorio / membresía / racha (Feature 075)

1. Al arrancar, `ensureNotificationJobsTables` crea `client_notification_settings` y `notification_dedupe`; el ENUM de `notifications` se amplía en `ensureNotificationsTable`.
2. Tras `listen`, un tick inmediato (~5s) y luego cada 60s llama `notificationJobsService.runTick()` (errores logueados; no tumba el proceso).
3. **Workout reminder:** si el alumno tiene reminder enabled y la hora local (TZ de settings) coincide (ventana primeros 5 min), dedupe `workout_reminder:YYYY-MM-DD`; si hay rutina del `dia_semana` local y no hay sesión completed hoy → `workout_reminder` + push.
4. **Membresía:** a las 09:00 locales, si `days_remaining` ∈ {7,3,1} y `active` → `membership_expiring`; si días −1…−3 (gracia) → `membership_grace`; si fuera de gracia (`days_remaining < -3` o vencida sin gracia) → `membership_expired`. También notifica al `trainer_id` con dedupe `membership_trainer:…`.
5. **streak_at_risk:** a las 09:00 locales, si `current_streak > 0` y no hubo workout completed ayer (fecha civil local) → una vez al día.
6. Preferencias alumno: `GET|PUT /api/me/notification-settings` (solo rol `client`).

## PWA + Web Push (Feature 051)

1. El front registra service worker (`vite-plugin-pwa` / `src/sw.js`) y expone manifest instalable.
2. Opt-in (soft-prompt o toggle en perfil/ajustes) → permiso del navegador → `pushManager.subscribe(VAPID)` → `POST /api/push/subscriptions`.
3. `createNotification` inserta in-app y llama `pushService.notifyUserAsync` con `title` / `body` / `actionUrl` / `type`.
4. `sendMessage` (chat) hace push al receptor con deep-link `/client/messages` o `/trainer/messages` (sin fila en `notifications`), **salvo** si el receptor tiene presence reciente (`POST /push/presence`, app visible). SSE solo no suprime push (conexiones zombie al minimizar/cerrar la PWA).
5. SW: evento `push` → `showNotification`; `notificationclick` abre path relativo seguro (focus + `navigate` o `postMessage` `TRAINFIT_NAVIGATE` — Feature 086). Chat push se suprime en SW si hay ventana visible (backup).
6. Endpoints 404/410 se borran de `push_subscriptions`. Sin VAPID en env, el envío se omite (API de subscribe responde 503 en clave pública).
7. Presencia: `AppShell` envía heartbeat mientras `document.visibilityState === 'visible'`; al ocultar/logout limpia con `DELETE /push/presence`. El chat pausa el EventSource al pasar a `hidden` y lo reabre al volver a `visible`.
8. **Feature 086:** al volver a `visible`, re-bind soft de la suscripción push (throttle 15s) sin pedir permiso de nuevo.

## Catálogo / programación (Feature 089)

1. Router: Login eager; resto de vistas con `() => import(...)`. `Dashboard.vue` carga async solo trainer o client según rol.
2. Client 360 / Library: paneles pesados (`Programming`, dietas, chat, `TemplateFormDialog`, etc.) vía `defineAsyncComponent`.
3. Programación / plantillas:
   - Índice slim: `getAllExercises({ enriched: true, fields: 'summary' })` → `shallowRef` para lookups y preview en vivo.
   - Picker: `searchExercisesForPicker` (`q`, `limit=40`, `fields=summary`) alimenta `:items` del autocomplete (≤40 nodos DOM).
4. Dietas Client 360: `listDietPlans(clientId, { summary: true })` → al editar `getDietPlan(id)` con árbol completo.
5. Media offscreen: `loading="lazy"` / `preload="none"` en thumbs; player activo sin diferir carga.
6. Guías: [ADR-0012](decisions/ADR-0012-web-vitals-performance.md), [performance-web-vitals.md](performance-web-vitals.md).

## Resiliencia en segundo plano (Feature 086)

1. Wake Lock de pantalla en el Workout Player mientras hay series/descanso activos.
2. Fin de descanso oculto → notificación local `rest_complete` si el usuario ya concedió notificaciones.
3. Cierre de sesión sin red → IndexedDB → flush automático al recuperar conectividad (ADR-0009).

## Recuperación de entrenamiento en curso (Feature 088)

1. Durante `working` / `resting`, `useWorkoutSession` escribe un draft en IndexedDB (`trainfit-offline` / `active_workout_draft`, key `clientId`) con índices, logs, `startedAt`, snapshot de rutina y `restEndsAt` si aplica (ADR-0011). Flush inmediato al cambiar de fase y al desmontar.
2. Al abrir Home (`ClientDashboardView`) o el Player: si hay draft → modal Reanudar / Descartar.
3. Reanudar hidrata el composable (`restore`) y salta «Comenzar»; descanso futuro reanuda wall-clock; descanso vencido avanza sin beep.
4. Al completar (POST OK o enqueue 086), Cancelar o Descartar → se borra el draft (evita recuperación fantasma).
5. Notificación `rest_complete`: si la ventana ya está en `/client/workout/:id`, el SW solo hace **focus** (+ `TRAINFIT_WORKOUT_FOCUS`) sin `navigate`/remount; el `actionUrl` lleva `?resume=1` por si hace falta abrir de nuevo.


## Modo sombra (Feature 076)

1. Cliente en Workout Player (`working`/`resting`) hace `PATCH /me/workout-live` (throttle ≥5s).
2. API escribe Redis `shadow:live:{clientId}` (SETEX 45s) + `SADD shadow:idx:{trainerId}`.
3. Trainer en dashboard hace `GET /trainer/live-sessions` cada ~8s → `SMEMBERS` + pipeline `GET`; limpia ids stale.
4. Trainer `POST .../cues` → rate-limit Redis + `pendingCue` en el live doc.
5. Siguiente `PATCH` del cliente devuelve el cue en la respuesta (sin GET extra) y lo borra del doc.
6. Al terminar/`DELETE /me/workout-live` se elimina la key y el índice.
7. Preferencia sombra: solo MySQL; no historial de cues.

Ver [ADR-0009](decisions/ADR-0009-shadow-mode-redis-ephemeral.md).
