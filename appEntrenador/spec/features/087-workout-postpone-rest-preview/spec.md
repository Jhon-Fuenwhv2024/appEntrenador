# 087 · Flexibilidad de ejecución y previsualización en descanso

**Estado:** en progreso  
**Depende de:** 010 (motor), 028 (rest timer), 059 (player híbrido / Up next)  
**Relacionada:** 029 (superseries), 044 (media catálogo)

## Qué hace

En el Workout Player del cliente:

1. **Máquina ocupada** — el alumno puede saltar el ejercicio activo **solo cuando el equipo no está libre**; se marca como pospuesto y se inserta **justo después del siguiente** en la cola (solo frontend). El CTA dice «Máquina ocupada» (no «Posponer»/skip genérico) para reducir abuso. Ej.: Press → Laterales → …; al usarlo en Press queda Laterales → Press → ….
2. **Ficha técnica en descanso** — durante el descanso, “Siguiente ejercicio” abre un modal con media, descripción y musculatura, sin pausar el temporizador.

## Criterios de aceptación

### Frontend

- [x] `postponeExercise(exerciseId?)` en `useWorkoutSession`: no completa ni borra; estado `pospuesto`; inserta tras el siguiente; avanza al siguiente.
- [x] Botón contextual **Máquina ocupada** (chip arriba, no bajo Completar serie); solo visible antes de la 1ª serie del ejercicio; snackbar de confirmación.
- [x] No posponer si es el último ejercicio restante de la cola (feedback claro).
- [x] Up next en descanso es interactivo; modal con nombre, media autoplay/loop, descripción y músculos.
- [x] El modal no pausa el contador; al cerrar se destruye el `<video>` (`v-if`) para evitar fugas.
- [x] Contraste Trainfit; safe-area; touch targets Gym UI.

### Backend

- [x] Enriquecimiento de `GET /me/routines`: musculatura del catálogo en `ejercicios[]` (sin migraciones).

### Fuera de alcance

- Persistencia del orden pospuesto en el servidor
- Sustitución de ejercicio por otro del catálogo
- Cambiar contratos de `POST /me/workout-sessions`
