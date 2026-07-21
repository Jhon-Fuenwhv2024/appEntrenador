# 058 · Preview de rutina del día (cliente)

**Estado:** implementado  
**Depende de:** 038 (home immersivo), 011 (Workout Player), 022 (media catálogo)  
**Relacionada:** 029 (superseries)

## Qué hace

Añade el botón **Ver rutina** junto a **Empezar** en el home del cliente. Abre una pantalla de solo lectura con la rutina del día (la misma que Empezar) listando todos los ejercicios con GIF/video/demo cuando exista media en el catálogo.

## Criterios de aceptación

### Frontend

- [x] CTA **Ver rutina** (outlined) junto a Empezar / visible también si completado o bloqueado (si hay `todayRoutine`)
- [x] Ruta `/client/routine/:routineId` (`ClientRoutinePreview`)
- [x] Lista completa de ejercicios: nombre, series×reps, descanso, indicaciones, badge superserie
- [x] Media por ejercicio vía `WorkoutExerciseMedia` (`media_type` / `media_url` / `local_media_path`)
- [x] CTA **Empezar rutina** → Workout Player; deshabilitado si membresía bloqueada
- [x] No crea sesión ni registra series
- [x] Contraste Trainfit; mobile ~390px

### Backend

- Sin cambios (media ya en `GET /me/routines`)

### Fuera de alcance

- Editar rutina desde el cliente
- Preview de rutinas de otros días (solo la del id pasado; home usa la de hoy)
