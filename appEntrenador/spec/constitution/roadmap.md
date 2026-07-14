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

## Siguiente

- **Plantillas de rutinas + memoria de progresión** — biblioteca reutilizable (el historial de pesos por sesión ya arranca en 012).
- **Perfil alumno (`alumnos_info`)** — API y UI de datos extendidos.
## Backlog / ideas

- **Config por entorno** — endurecer `.env` para DB; quitar credenciales hardcodeadas en `db.js`.
- **Pinia / TypeScript** — solo si el estado o el tamaño del equipo lo justifican.
- **Extracción `modules/invites`** — sacar invitaciones del módulo auth.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.
