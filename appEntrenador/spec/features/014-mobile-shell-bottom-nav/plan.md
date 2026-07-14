# 014 · Plan

## Enfoque

1. Extraer `AppShell` + `AppBottomNav` + `appShell.css` (sidebar desktop / bottom nav móvil).
2. Migrar vistas autenticadas al shell; header con logout móvil.
3. Dashboard trainer: orden móvil con `display: contents` + `order` (alumnos arriba).
4. Pulir CSS responsive (960 / 600) y Workout Player safe-area.
5. Docs (`docs/RESPONSIVE.md`, nota en architecture) + validar build.

## Nav por rol

| Rol | Items |
|-----|-------|
| trainer | `/dashboard`, `/trainer/exercises` |
| client | `/dashboard` |

## Archivos

- `src/shared/layout/AppShell.vue`, `AppBottomNav.vue`
- `src/assets/appShell.css`
- Vistas trainer/client + CSS dashboards
- `docs/RESPONSIVE.md`, `docs/architecture.md`
