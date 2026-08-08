# 091 · Periodización deportiva (Macro / Meso / Micro)

**Estado:** implementado (MVP)  
**Depende de:** 018 (plantillas), 012 (workout sessions / set logs), 019 (last_log), 085 (set_prescription), 064 (patrón ciclo dieta)  
**Alimenta:** Programación trainer, asignación a alumno, memoria de progresión

## Qué hace

Introduce la jerarquía **Macrociclo → Mesociclo → Microciclo → Sesión** sobre el modelo actual de rutinas, sin romper `rutinas` / `ejercicios` / `routine_templates` / `workout_*`.

Además:

- Memoria de progresión: al materializar/asignar, el trainer puede aplicar **mismo peso/reps** que el último levantamiento del alumno, o **mismo + incremento**.
- Presets de mesociclo (hipertrofia, fuerza, descarga, pico…) para armar programas rápido.
- Propagar Semana 1 → resto del mesociclo con regla de progresión por microciclo.

## Criterios de aceptación

- [x] Tablas: `training_programs`, `program_phases`, `program_weeks`, `program_days`, `program_exercises`, `client_program_assignments`
- [x] Columnas opcionales en `rutinas` / `workout_sessions` para linaje (`assignment_id`, `program_day_id`, `source_week_index`)
- [x] CRUD programas (trainer ownership)
- [x] Crear mesociclo desde preset + seed de días desde plantillas existentes
- [x] Propagar microciclos con reglas (`hold` | `add_weight` | `add_reps` | `deload_pct`)
- [x] Asignar programa/fase a alumno con `progression_mode`: `template` | `same_as_last` | `last_plus`
- [x] Materializar solo la semana activa → `rutinas`/`ejercicios` (lazy; no duplicar 28× a priori)
- [x] Avanzar microciclo rematerializa y aplica progresión
- [x] UI en Recursos → tab Programas (listar, wizard, asignar)
- [x] Docs: `database-schema.md`, `api.md`, ADR-0013
- [x] Build FE + backend arranca con `ensureTrainingProgramsTables`

## Fuera de alcance (esta feature)

- Auto-avance de semana por calendario sin acción del trainer (solo resolución informativa)
- Overrides por serie a nivel assignment sin rematerializar
- UI cliente distinta al Player actual (sigue leyendo `rutinas`)
- Migración masiva de `routine_templates` → programas
