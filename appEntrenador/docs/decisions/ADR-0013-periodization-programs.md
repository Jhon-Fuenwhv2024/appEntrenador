# ADR-0013 — Periodización deportiva (Macro / Meso / Micro)

## Estado

Aceptado (Feature 091)

## Contexto

Trainfit modelaba entrenamiento como **split semanal fijo** (`rutinas.dia_semana` → `ejercicios`) más plantillas con deep copy. Eso no sostiene periodización (macrociclo → mesociclo → microciclo → sesión) ni asignación de un bloque de 4 semanas sin duplicar rutinas.

La auditoría de arquitectura (Fase 3) propuso una capa nueva sin destruir el Player ni las tablas legacy.

## Decisión

1. **Biblioteca periodizada:** `training_programs` (macro) → `program_phases` (meso) → `program_weeks` (micro) → `program_days` → `program_exercises`.
2. **Asignación:** `client_program_assignments` con `start_date`, `current_week_index`, `progression_mode` (`template` | `same_as_last` | `last_plus`).
3. **Materialización lazy:** solo la semana activa se copia a `rutinas`/`ejercicios` (linaje `assignment_id`, `program_day_id`, `source_week_index`). Avanzar semana rematerializa.
4. **Memoria de progresión:** al materializar, se leen últimos `workout_set_logs` por nombre de ejercicio (mismo criterio Feature 019) y se aplica mismo peso o último + incremento.
5. **UX rápida:** presets de mesociclo + seed desde `routine_templates` + propagación semana 1 → N.

## Consecuencias

- Compatibilidad: el cliente sigue entrenando vía `rutinas` existentes.
- No hace falta clonar 28 días al asignar un mesociclo de 4×4.
- Coste: el trainer debe “Avanzar semana” (o futuro job) para rotar el microciclo.
- Plantillas diarias siguen siendo el átomo reutilizable; los programas las orquestan en el tiempo.
