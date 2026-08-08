# 091 · Tasks

- [x] Spec / plan
- [x] DDL `035_training_programs.sql` + append `script_db.sql`
- [x] `ensureTrainingProgramsTables.js` + boot en `server.js`
- [x] Module `backend/src/modules/programs/` (routes → controller → service)
- [x] Progresión: last lifts + `same_as_last` / `last_plus` / `template`
- [x] Presets + propagate week 1
- [x] FE: `programsApi.js`, `ProgramsPanel`, wizard, assign dialog
- [x] Tab Programas en Recursos + ruta
- [x] Client 360: card asignación activa
- [x] Docs `database-schema.md` + `api.md` + ADR-0013
- [x] Validar: syntax check + `npm run build` OK

## Iteración UI (post-review)

- [x] Fix bloqueo paso 3 del wizard: se puede crear sin plantillas (solo estructura) + CTA a Plantillas
- [x] Fix crash de desmontaje: keys estables por fila, sin `defineAsyncComponent` en diálogos
- [x] `ProgramWeekDaysDialog`: editar semana base de un mesociclo y propagar (cierra el ciclo sin plantillas previas)
- [x] Rediseño acorde al estilo Trainfit (tokens `--tf-*`, chips, empty states, focus-visible, targets 44px)
- [x] Tablero semanal: cabecera "Microciclo N de M" + chip `S{n}` por rutina (rutinas exponen `assignment_id` / `source_week_index`)
