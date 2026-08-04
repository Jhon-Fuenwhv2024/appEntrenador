# 084 · Preview en vivo del builder de rutinas (split)

**Estado:** implementado  
**Depende de:** 061 (programación trainer), 058 (preview cliente + media), 022 (catálogo / `exercise_id`)  
**Alimenta:** tab Programación del Client 360 (modo trainer)  
**Relacionada:** 067 (mismo patrón split para dietas; siguiente entrega)

## Qué hace

Al crear/editar una rutina en Programación, el trainer ve en tiempo real cómo queda la sesión (lista tipo cliente) y el GIF/video del ejercicio del catálogo, sin guardar obligatorio.

Layout:

1. **Desktop (≥960px):** split — **izquierda** editor (`RoutineDayBuilder`), **derecha** preview.
2. **Móvil (&lt;960px):** editor + preview colapsable debajo.

## Criterios de aceptación

### Preview en vivo

- [x] Preview sincronizado con el draft (`nombre_rutina`, `dia_semana`, ejercicios, series/reps/kg/descanso, superserie).
- [x] Desktop (≥960px): layout split — **izquierda** editor, **derecha** preview.
- [x] Media por ejercicio vía catálogo (`exercise_id` o nombre) usando `WorkoutExerciseMedia`.
- [x] Placeholder “Sin demo” si no hay media.
- [x] Sin fetch `/me/*`; datos inyectados desde el draft + catálogo (adapter).
- [x] Sin CTA Empezar / lógica de membresía en el preview del trainer.
- [x] Preview sin descripción larga del ejercicio (solo media + prescripción).

### Media en el editor

- [x] Thumb/media compacta en cada fila del builder cuando hay match de catálogo con media.

### UX / tema

- [x] Contraste ADR-0001; menús `tf-overlay-menu`.
- [x] Clearance `--tf-bottom-nav-clearance` intacto en móvil.
- [x] Focus visible; targets táctiles razonables.
- [x] Build FE OK.

## Fuera de alcance

- Feature 067 (dietas).
- Cambios de API / schema MySQL.
- Periodización multi-semana de rutinas.
- Object storage de media (068).
- Cambiar el preview del cliente (058) más allá de reutilizar markup/estilos.
