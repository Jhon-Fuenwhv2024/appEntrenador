# 035 · Plan — Dashboard Analítico del Entrenador

## Enfoque

1. **Definir reglas de negocio** en docs (activo/inactivo, ventana de días, qué cuenta como check-in “sin revisar”).
2. **Backend:** enriquecer `getDashboardStats` en `backend/src/modules/clients/clients.service.js` (misma ruta `GET /api/trainer/dashboard`) con agregados SQL:
   - Un query (o CTE) para conteos activos/inactivos/total.
   - Un query para pendientes: check-ins sin revisar + clientes sin nutrición/dieta.
   - Un query para progreso semanal: sesiones finished agrupadas por día de la semana actual (+ total).
3. Evitar bucles `for client of clients` con queries dentro; preferir `GROUP BY` / subselects / `LEFT JOIN` agregados.
4. **Frontend:** refactor de `TrainerDashboardView.vue` a grid de tarjetas; extraer `TrainerKpiCard` (o ampliar `TrainerStatsSummary`); gráfico semanal ligero (extender `TrainerMonthlyActivityChart` o componente `TrainerWeekProgressChart`).
5. Actualizar `clientsApi.getTrainerDashboard` y docs API / data-flows.

## Contrato de respuesta (propuesta)

```json
{
  "clientsCount": 12,
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
    "byDay": [{ "date": "2026-07-13", "count": 3 }]
  },
  "routinesCount": 0,
  "sessionsThisMonth": 0,
  "growthPercent": 0,
  "monthlyActivity": []
}
```

Campos 015 existentes se mantienen para no romper UI hasta migrar widgets.

## Definiciones MVP (ajustar en implementación y documentar)

- **Activo:** cliente con ≥1 `workout_sessions` finished en últimos 14 días (o membresía `active` si se prefiere; elegir una y fijarla en docs).
- **Check-in sin revisar:** fila en `weekly_checkins` sin flag/campo de revisión del trainer (si no existe columna, añadir `reviewed_at` nullable en esta feature o usar proxy documentado).
- **Dieta por asignar:** sin fila en `nutrition_targets` hasta que 043 exponga planes activos; luego: sin `diet_plans` asignado vigente.

## Archivos clave

- BE: `clients.service.js`, `clients.controller.js`, `clients.routes.js`
- FE: `TrainerDashboardView.vue`, `TrainerStatsSummary.vue`, `clientsApi.js`
- Docs: `docs/api.md`, `docs/data-flows.md` (o ADR corto de métricas)

## Decisiones

- Reutilizar endpoint existente (no crear `/dashboard-stats` paralelo) salvo que el payload crezca demasiado; entonces documentar versión.
- Gráficos: librería ya usada en el repo (027); no añadir dependencia nueva sin permiso.
