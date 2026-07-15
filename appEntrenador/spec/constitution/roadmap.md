# Roadmap

## Hecho

1. **Auth básica + invitaciones** — login, registro con token, roles `trainer` / `client`, listado de clientes (`GET /api/clients`). (Código legado previo a SDD; sin carpeta `features/` histórica.)
2. **001 · Modularizar auth y API compartida** — cliente Axios compartido, auth en `features/auth` y backend auth en `modules/auth`, sin cambiar el comportamiento visible.
3. **002 · Modularizar clientes y portal entrenador** — `GET /api/clients` en `modules/clients` y dashboard entrenador bajo `features/trainer`.
4. **003 · Auth JWT y middleware de roles** — login emite JWT; middleware `authenticate` / `requireRole`; Axios con Bearer token.
5. **004 · Ownership trainer↔cliente** — `trainer_id` en invitaciones y usuarios; listado de clientes filtrado por trainer autenticado.
6. **005 · API CRUD rutinas y ejercicios** — módulo `routines` con ownership y transacciones.
7. **006 · UI trainer de rutinas** — detalle de cliente y asignación de planes.
8. **007 · Portal cliente con rutinas reales** — dashboard cliente consumiendo `/me/routines`.
9. **008 · Catálogo de ejercicios (schema + seed)** — tabla `exercises` híbrida + seed local aplicado.
10. **009 · API/UI catálogo de ejercicios** — `GET/POST /exercises`, vista `/trainer/exercises` y combobox en rutinas.
11. **010 · Motor de ejecución de rutina** — composable `useWorkoutSession` (series, descanso, auto-avance).
12. **011 · Workout Player UI** — modo Comenzar mobile-first con media y registro de peso/reps.
13. **012 · Persistencia de sesión** — logs en DB + historial visible al trainer.
14. **013 · Contraste UI + responsive mobile** — tokens `on-primary`/`on-success`, CTAs legibles y pass mobile en vistas principales.
15. **014 · Mobile shell: bottom nav** — shell compartido, bottom nav ≤960px, logout en header móvil.
16. **015 · Dashboard trainer con datos reales** — stats/API reales; estado Activo/Sin plan; sin dietas.
17. **021 · Progreso / historial del cliente** — `GET /me/workout-sessions`, vista Mi progreso, historial pulido en ficha trainer.
18. **026 · Composición corporal del cliente** — historial antropométrico (peso, % grasa, IMC…); write solo trainer; client solo lectura.

## Siguiente (016–024)

Orden acordado con IA de nav trainer: **Inicio · Alumnos · Biblioteca · Ajustes**.

1. **016 · IA de navegación trainer (shell)** — 4 slots; Ejercicios fuera de la barra.
2. **017 · Alumnos como destino propio** — `/trainer/clients`; Inicio como hub.
3. **018 · Plantillas de rutinas (Biblioteca)** — biblioteca reutilizable; asignar = copia.
4. **019 · Memoria de progresión** — último peso/reps desde logs (012).
5. **020 · Perfil alumno (`alumnos_info`)** — API + UI (schema ya existe).
6. **022 · Catálogo en Biblioteca + `exercise_id`** — vínculo estable línea↔catálogo.
7. **023 · Invitaciones: módulo + gestión** — `modules/invites`, listar/revocar.
8. **024 · Ajustes de cuenta** — nombre + cambio de password.

> Nota: 016–020 figuran aún en esta lista por orden histórico del bloque; varias ya están implementadas en código/spec. **021** está en Hecho.

## Fase 1: Core de Entrenamiento (Mejoras en el gimnasio)

1. **025 · Notificaciones In-App** — Alerta al cliente de rutina actualizada, alerta al trainer de rutina completada.
2. **027 · Visualización de Progreso (Gráficas)** — Gráficas de peso, IMC y evolución de ejercicios clave.
3. **028 · Mejoras al Temporizador de Descanso** — Alerta sonora al finalizar, tiempo configurable por el entrenador.
4. **029 · Superseries y Circuitos** — Agrupar ejercicios (1A, 1B) para ejecutarlos sin descanso.

## Fase 2: Retención y Hábitos (Más allá del gimnasio)

5. **030 · Récords Personales (PRs) y Celebraciones** — Animación al levantar más peso o volumen histórico.
6. **031 · Módulo de Nutrición MVP** — Asignación de objetivos diarios de macros y calorías.
7. **032 · Seguimiento de Hábitos Diarios** — Checklist diario opcional (agua, sueño, pasos).
8. **033 · Fotos de Progreso y Check-in Semanal** — Subida de fotos mensuales y cuestionario de bienestar.

## Fase 3: Comunicación y Gestión del Negocio

9. **034 · Mensajería Interna (Chat MVP)** — Chat directo entre entrenador y alumnos.
10. **035 · Dashboard Analítico del Entrenador** — KPIs de negocio (ingresos, retención, actividad).
11. **036 · Gestión de Pagos / Control de Suscripciones** — Control de morosidad y bloqueo manual de acceso a rutinas.

## Backlog / ideas futuras

- **Caducidad de invitaciones / email SMTP**
- **Tests E2E / API críticos** — login, ownership, guardar sesión.
- **Pinia / TypeScript** — solo si el estado o el tamaño del equipo lo justifican.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.