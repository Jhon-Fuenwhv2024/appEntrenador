# 014 · Mobile shell: bottom nav + alumnos arriba

**Estado:** implementada

## Qué hace

Unifica el shell autenticado (trainer + client) para móvil ~390px: navegación inferior fija, logout accesible en el header, y en el dashboard del trainer la lista **Mis Alumnos** aparece antes del gráfico/acciones. Sin cambios de API, schema ni lógica de negocio.

## Criterios de aceptación

- [x] Shell compartido (`AppShell` + `AppBottomNav`) usado en dashboards trainer/client, catálogo y rutinas del alumno
- [x] ≤960px: sidebar oculta; bottom nav fija con safe-area; solo rutas reales (sin placeholders)
- [x] Logout visible en header en móvil; en desktop permanece en la sidebar
- [x] Dashboard trainer móvil: header → stats → Mis Alumnos → chart/acciones → bottom nav
- [x] Stats en 2×2 a ≤960px; profile compacto (solo avatar) a ≤600px
- [x] Workout Player sin bottom nav; safe-area básico
- [x] Sin overflow horizontal relevante en ~390px
- [x] `npm run build` frontend OK

## Fuera de alcance

- Activar iconos placeholder (progreso, dietas, settings)
- Rediseño visual del mockup desktop
- Cambios de API/DB
- Kanban Obsidian
