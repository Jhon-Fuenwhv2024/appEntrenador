# 016 · IA de navegación trainer (shell)

**Estado:** pendiente

## Qué hace

Congela la arquitectura de información del portal trainer: cuatro destinos estables en sidebar (desktop) y bottom nav (móvil ≤960px). Reubica el catálogo de ejercicios fuera de la barra principal (queda como herramienta de Biblioteca). No implementa producto nuevo de dominio; solo estructura de navegación y placeholders seguros.

## Destinos trainer

| Slot | Label | Ruta objetivo | Notas |
|------|-------|---------------|-------|
| 1 | Inicio | `/dashboard` | Hub: stats, invitaciones, accesos rápidos |
| 2 | Alumnos | `/trainer/clients` | Lista; ficha/rutinas siguen siendo contexto |
| 3 | Biblioteca | `/trainer/library` | Placeholder hasta 018; catálogo accesible desde aquí |
| 4 | Ajustes | `/trainer/settings` | Placeholder hasta 024 |

## Criterios de aceptación

- [ ] Trainer: 4 ítems en bottom nav y sidebar (Inicio, Alumnos, Biblioteca, Ajustes)
- [ ] Ítem “Ejercicios” ya no es destino de primer nivel en la barra
- [ ] Rutas placeholder de Biblioteca y Ajustes no rompen auth ni muestran 404 crudo (vista “próximamente” o shell vacío documentado)
- [ ] Ficha `/trainer/clients/:clientId` sigue siendo contexto (no ítem de barra); puede marcar Alumnos como activo
- [ ] Client: sin cambios de IA salvo lo necesario para no romper el shell compartido
- [ ] Logout permanece fuera de los 4 slots (header móvil / pie sidebar)
- [ ] `npm run build` frontend OK; `docs/architecture.md` y `docs/RESPONSIVE.md` actualizados

## Fuera de alcance

- Lista real de alumnos en ruta propia (017)
- Plantillas / catálogo embebido (018, 022)
- Pantalla real de ajustes (024)
- Dietas, notificaciones, progreso cliente
