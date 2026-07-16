# 038 · Plan — Rediseño Inmersivo del Modo Cliente

## Enfoque

1. Reescritura visual de `ClientDashboardView` (hero del día + CTA) sin cambiar contratos de API.
2. Extraer CSS a `clientDashboard.css` / tokens locales que respeten `theme-base.css` y `vuetify.js` (dark + cyan).
3. Alinear `WorkoutPlayerView`, `ClientProgressView` y `ClientProfileView` al mismo lenguaje.
4. Ajustes menores en `AppShell` / `AppBottomNav` solo si afectan al alumno (no romper trainer).
5. Opcional: endpoint agregado `GET /me/today` en módulo client/routines que combine rutina del día + hábitos; si no, mantener N llamadas actuales.
6. Documentar cambios de UX en `docs/` solo si hay nuevo endpoint o flujo.

## Archivos clave

- FE: `src/features/client/ClientDashboardView.vue`, `WorkoutPlayerView.vue`, `ClientProgressView.vue`, `ClientProfileView.vue`
- FE assets: `src/assets/clientDashboard.css`, `src/assets/theme-base.css`
- Shell: `src/shared/layout/AppShell.vue`, `AppBottomNav.vue`
- Componentes: `MacroSummaryCard`, `DailyHabitsChecklist`, `NotificationBadge`
- BE opcional: `backend/src/modules/routines` o nuevo handler “today”
- Contraste: ADR-0001, `.cursor/rules/ui-contrast-theme.mdc`

## Riesgos

- No reactivar overlays Vuetify opacos (texto tapado en dark).
- No introducir cards decorativas que diluyan el hero.
- No romper navegación existente ni guards de rol.
