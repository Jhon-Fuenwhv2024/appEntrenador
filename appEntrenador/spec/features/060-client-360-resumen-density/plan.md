# Plan · 060 Resumen Client 360 densidad

## Component map

| Pieza | Responsabilidad |
|-------|-----------------|
| `MembershipPanel.vue` | Vista status card + modo edición inline |
| `ConsistencyPanel.vue` | Strip denso + edición de meta bajo demanda |
| `WorkoutSessionHistoryList.vue` | Lista accordion + agrupación por día + load-more UI |
| `Client360Overview.vue` | Pasa `hasMore` / emite `load-more` |
| `Client360View.vue` | Paginación trainer (append sessions) |
| `workoutSessionsApi.js` | Query `limit`/`offset` |
| `workout-sessions.service.js` | `listSessionsForClient(clientId, { limit, offset })` |

## Pasos

1. SDD (`spec.md` / `plan.md` / `tasks.md`).
2. Membresía vista/edición.
3. Consistencia compacta.
4. Backend paginación + FE historial agrupado.
5. Docs (`api.md`, `data-flows.md`) + build.
