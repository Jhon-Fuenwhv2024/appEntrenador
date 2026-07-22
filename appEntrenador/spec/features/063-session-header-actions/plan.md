# 063 · Plan — Session header actions

## Enfoque

1. Crear componentes compartidos en `src/shared/layout/`:
   - `SessionHeaderActions.vue` — cluster campana + menú cuenta
   - `UserAccountMenu.vue` — avatar, identidad, perfil/ajustes, logout + confirm
2. Composable `useSessionAccount.js` — carga `getMyAccount()`, avatar, logout.
3. Mejorar `NotificationBadge.vue`: badge numérico (`99+`).
4. Sustituir markup duplicado en vistas cliente/trainer; quitar `header-logout-btn`.
5. Actualizar `docs/architecture.md` (+ nota a11y si aplica).
6. Validar con `npm run build` y smoke visual.

## Archivos clave

- Nuevos: `src/shared/layout/SessionHeaderActions.vue`, `UserAccountMenu.vue`, `src/shared/composables/useSessionAccount.js`
- Mejorar: `src/components/notifications/NotificationBadge.vue`
- Vistas: `ClientDashboardView`, `ClientProgressView`, `ClientProfileView`, `TrainerDashboardView`, `ClientsListView`, `LibraryView`, `TrainerSettingsView`, `Client360View`
- CSS: `src/assets/appShell.css` (limpiar `.header-logout-btn` si queda sin uso)
- Docs: `docs/architecture.md`

## Decisiones

- Logout sidebar desktop se mantiene en `AppShell`.
- Sin cambios de backend / schema.
- Avatar compacto unificado (sin profile-pill ancho en trainer Inicio).
