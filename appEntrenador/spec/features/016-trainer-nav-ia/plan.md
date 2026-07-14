# 016 · Plan

## Enfoque

1. Actualizar `AppBottomNav.vue` + `AppShell.vue`: 4 slots trainer; quitar exercises como nav de primer nivel.
2. Router: añadir `/trainer/clients` (puede redirigir temporalmente o montar vista mínima), `/trainer/library`, `/trainer/settings` con vistas placeholder ligeras bajo `features/trainer/`.
3. Mantener `/trainer/exercises` accesible por URL o link desde placeholder Biblioteca (sin ítem de barra).
4. Resolver `active` key: `dashboard | clients | library | settings`; rutas de ficha cliente → `clients`.
5. Docs: architecture (nav), RESPONSIVE (slots).

## Nav por rol (objetivo)

| Rol | Items |
|-----|-------|
| trainer | Inicio, Alumnos, Biblioteca, Ajustes |
| client | Inicio (sin cambios de producto en esta feature) |

## Archivos previstos

- `src/shared/layout/AppShell.vue`, `AppBottomNav.vue`
- `src/router.js`
- Vistas placeholder trainer (library/settings; clients si hace falta stub)
- `docs/architecture.md`, `docs/RESPONSIVE.md`
