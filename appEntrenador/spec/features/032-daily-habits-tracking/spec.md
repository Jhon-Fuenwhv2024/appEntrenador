# 032 · Seguimiento de Hábitos Diarios (MVP)

**Estado:** implementado
**Depende de:** 020 (Ficha/Perfil del alumno)

## Qué hace
Un sistema de "Checklist" diario. El entrenador puede crear y asignar hábitos personalizados de texto libre (ej. "Beber 2L de agua", "Dormir 8 horas") a un cliente. El cliente ve su lista diaria y marca los hábitos como completados.

## Criterios de Aceptación

- [ ] **Base de Datos:**
      - Tabla `habits`: `id`, `client_id` (FK), `trainer_id` (FK), `title` (VARCHAR).
      - Tabla `habit_logs`: `habit_id` (FK), `logged_date` (DATE). **Clave única compuesta** de `(habit_id, logged_date)`.
- [ ] **Regla Crítica de Zonas Horarias:**
      - Las fechas de completado (`logged_date`) DEBEN manejarse y enviarse desde el Frontend como cadenas de texto formato `YYYY-MM-DD` correspondientes a la zona horaria local del cliente. El backend no debe aplicar transformaciones UTC a estas fechas.
- [ ] **API y Lógica de Toggles:**
      - `POST /api/habits/:habitId/toggle` -> Si el registro para ese `logged_date` existe, lo elimina (desmarca). Si no existe, lo inserta (marca).
- [ ] **UI Trainer:**
      - Sección en el perfil del alumno para listar, añadir (input de texto) y eliminar hábitos activos.
- [ ] **UI Cliente (Dashboard):**
      - Tarjeta de Checklist Diario.
      - Al cargar, solicita los hábitos y sus estados para la fecha de "hoy" (según el móvil del usuario).
      - Checkboxes reactivos. Si no tiene hábitos, ocultar la tarjeta por completo (no mostrar estados vacíos molestos).

## Fuera de alcance
- Rachas automáticas (Streaks).
- Gráficas mensuales de cumplimiento de hábitos.
- Hábitos con frecuencias complejas (ej. "Solo martes y jueves"). Todos son diarios para este MVP.