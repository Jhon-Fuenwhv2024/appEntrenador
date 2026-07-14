# 018 · Plan

## Enfoque

1. Diseñar DDL (permiso de schema): plantilla + ejercicios de plantilla; ownership `trainer_id`.
2. Módulo backend `templates` (o submódulo de `routines`): routes → controller → service; prepared statements + transacción al asignar.
3. Endpoints sugeridos: `GET/POST /api/templates`, `GET/PATCH/DELETE /api/templates/:id`, `POST /api/templates/:id/assign` `{ clientId, dia_semana? }`.
4. Frontend: `LibraryView` en `/trainer/library`; acciones guardar/asignar; Composition API + componentes enfocados (lista, form, assign dialog).
5. Actualizar `script_db.sql` + migración; docs.

## Decisiones

- Asignar = **copia**, no referencia viva a la plantilla.
- Peso en línea de plantilla = prescripción por defecto; historial de ejecución sigue en `workout_*` (012/019).
