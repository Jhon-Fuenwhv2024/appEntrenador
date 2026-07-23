# 066 · Plan — Rutina programada de hoy en Actividad reciente

## Enfoque

1. En el flujo Resumen 360, cargar rutinas del cliente (`getClientRoutines`) además de `workout_sessions`.
2. Resolver weekday local alineado con `useClientToday` / `getTodayBundle`.
3. En `Client360RecentSessions`, mergear en el bucket Hoy una fila sintética `kind: 'planned'` cuando falte sesión de esa rutina hoy.
4. Estilos: badge Pendiente + icono; desactivar expand de series para planned.
5. Validar en ~390px y que empty state solo aparezca sin rutina ni sesión.

## Decisiones

- Preferir merge en FE (padre pasa `routines` o `todayRoutines`); opcional futuro: enriquecer `GET /overview` con `todayRoutine` (no obligatorio en esta feature).
- Matching sesión↔rutina por `routine_id` en sesiones de hoy; si la sesión no trae `routine_id`, no bloquear la pendiente de esa rutina salvo que ya haya cualquier sesión hoy del mismo nombre (implementación: priorizar `routine_id`).
- Si hay varias rutinas el mismo `dia_semana` sin sesión: mostrar todas como Pendiente.
- No tocar bucket Ayer/older.

## Archivos clave

- FE: `src/features/trainer/client-360/Client360RecentSessions.vue`, `Client360Overview.vue` / `Client360View.vue`, `src/features/trainer/api/routinesApi.js`
- Referencia weekday: `src/features/client/composables/useClientToday.js`, `backend/src/modules/routines/routines.service.js` (`getTodayBundle`)
