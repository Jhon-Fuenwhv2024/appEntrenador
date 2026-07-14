# 015 · Dashboard trainer con datos reales

**Estado:** implementada

## Qué hace

Reemplaza mocks del dashboard del trainer (stats hardcodeadas, gráfico decorativo, estado Activo/Inactivo falso) por métricas reales del dominio del trainer autenticado. No hay módulo de dietas: la card correspondiente pasa a **Sesiones (mes)**.

## Criterios de aceptación

- [x] `GET /api/trainer/dashboard` (JWT + rol trainer) devuelve stats + serie mensual
- [x] Cards: Total alumnos, Rutinas activas, Sesiones del mes, Crecimiento (% MoM alumnos nuevos)
- [x] Gráfico: Alumnos acumulados + Sesiones por mes (últimos 6 meses)
- [x] Lista alumnos: estado `Activo` (tiene ≥1 rutina) o `Sin plan`
- [x] Sin cambios de schema; ownership por `req.user.id`
- [x] Build frontend OK; docs API actualizados

## Fuera de alcance

- Feature de dietas
- Notificaciones reales (badge)
- Analytics avanzados
