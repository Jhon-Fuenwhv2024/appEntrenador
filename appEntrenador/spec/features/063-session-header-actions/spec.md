# 063 · Session header actions (cuenta + notificaciones)

**Estado:** implementado  
**Depende de:** 014 (mobile shell), 025 (notificaciones in-app), 024 (ajustes de cuenta), 062 (a11y visual)  
**Alimenta:** consistencia de shell en todas las vistas autenticadas

## Qué hace

Unifica el cluster de sesión del header (campana de notificaciones + menú de cuenta con logout) en un componente compartido para **cliente y entrenador**, siguiendo el patrón moderno avatar-menu. Elimina el icono suelto de cerrar sesión en headers móviles.

## Criterios de aceptación

- [x] Existe `spec/features/063-session-header-actions/` con `spec.md`, `plan.md`, `tasks.md`.
- [x] Componente compartido `SessionHeaderActions` (campana + `UserAccountMenu`) usable con `role: 'client' | 'trainer'`.
- [x] Orden fijo top-right: notificaciones → avatar (sin logout suelto).
- [x] Badge de notificaciones numérico (`n` / `99+`); oculto si `unreadCount === 0`.
- [x] Menú de cuenta: identidad (nombre + email), enlace a perfil/ajustes, **Cerrar sesión** al final con confirmación.
- [x] Cliente: acción perfil → `/client/profile`. Trainer: acción → `/trainer/settings`.
- [x] Menús usan `tf-overlay-menu` (ADR-0001); icon-buttons con `aria-label`; targets ≥40px (ADR-0002).
- [x] Vistas cliente y trainer listadas en el plan sustituyen el markup duplicado.
- [x] Logout del sidebar desktop en `AppShell` se mantiene.
- [x] `npm run build` OK; smoke móvil ~390px sin botón logout suelto en headers.

## Fuera de alcance

- Push / PWA (051).
- Nuevos tipos de notificación o cambios de schema.
- Rediseño del saludo/fecha del header.
- Preferencias de notificación en ajustes.
- Cambiar logout del sidebar desktop.
