# 086 · Tasks

- [x] T1 · Spec / plan / tasks + roadmap
- [x] T2 · `useWakeLock` + cableado en player (`working`/`resting`)
- [x] T3 · Notificación local al fin de descanso si app oculta (+ SW helper)
- [x] T4 · Hardening push: re-bind en `visible` + `notificationclick` robusto
- [x] T5 · Cola IndexedDB + flush online + UX persistencia
- [x] T6 · Docs (ADR + data-flows) + build FE

## Smoke checklist

- [ ] Player: pantalla no se apaga en descanso (Chrome Android / desktop con soporte)
- [ ] Minimizar durante descanso → al volver, tiempo correcto; si permiso push, notificación local opcional
- [ ] Push: volver a la app tras background → suscripción sigue ligada
- [ ] Modo avión al terminar workout → mensaje pendiente → quitar avión → sesión en historial
