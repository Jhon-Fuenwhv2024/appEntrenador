# Plan · 061 Rediseño Programación (trainer)

## Component map

| Pieza | Responsabilidad |
|-------|-----------------|
| `Client360Programming.vue` | Orquestador: load CRUD, estado builder, assign, duplicate, notify |
| `ProgrammingWeekBoard.vue` | Strip L–D: vacío / card; emite create / edit / assign / duplicate / delete / save-template |
| `RoutineDayBuilder.vue` | Editor de un día (meta + ejercicios + progressive disclosure + reorder) |
| `ProgrammingAssignTemplateDialog.vue` | Lista plantillas + día; assign con `clientId` fijo |

## Reutiliza

- `templatesApi.assignTemplate` / `createTemplate`
- `routinesApi` CRUD
- `ExerciseMuscleFilter`, catálogo `getAllExercises`
- `AssignTemplateDialog` (Library) sin romper flujo existente

## Pasos

1. SDD (`spec.md` / `plan.md` / `tasks.md`).
2. `ProgrammingWeekBoard` + cableado en orquestador.
3. Extraer `RoutineDayBuilder` del form actual.
4. Dialog assign desde Programación.
5. Duplicar rutina a otro día vía `createClientRoutine`.
6. Docs (`data-flows.md`, `architecture.md`) + `npm run build`.
