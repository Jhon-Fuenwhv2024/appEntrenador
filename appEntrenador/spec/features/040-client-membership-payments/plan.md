# 040 · Plan — Membresía y Pago del Alumno

## Enfoque

1. DDL `client_memberships` + migración `019_client_memberships.sql` + `ensureClientMemberships` al boot + `script_db.sql`.
2. Módulo Express `memberships`: routes → controller → service (cálculo `days_remaining`, upsert, ownership).
3. Guard reutilizable (`assertClientMembershipAccess`) llamado desde workout-sessions (start) y opcionalmente routines `/me`.
4. FE API: `features/trainer/api/membershipApi.js`, `features/client/api/membershipApi.js` (o shared).
5. FE trainer: `MembershipPanel.vue` en ficha 360 / ClientRoutines; filtros en `ClientsListView`.
6. FE client: chip + banner; soft-lock en `WorkoutPlayerView` ante error `MEMBERSHIP_BLOCKED`.
7. Docs: `docs/api.md`, `docs/database-schema.md`, `docs/data-flows.md`.
8. Marcar **036** como supersedida por 040 en su spec (nota de estado).

## Archivos clave

- BE: `backend/src/modules/memberships/*`, `backend/db/migrations/`, `backend/src/db/ensure*.js`, `server.js`
- FE trainer: panel membresía, `ClientsListView.vue`, cabecera 360
- FE client: dashboard/perfil/player
- Docs + referencia cruzada con 036 / 037

## Reglas de estado

- Al guardar: si `period_end < today` → puede forzar `expired` en service.
- Trainer puede poner `owing` aunque el periodo no haya vencido (mora).
- `block_on_unpaid` solo aplica cuando status no es `active` (o expired/owing según regla documentada).
