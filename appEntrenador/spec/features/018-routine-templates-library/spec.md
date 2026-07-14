# 018 · Plantillas de rutinas (Biblioteca)

**Estado:** hecha

**Depende de:** 016 (slot Biblioteca); recomendable tras 017

## Qué hace

Biblioteca personal del trainer: guardar rutinas como plantillas reutilizables y asignarlas a un alumno sin alterar la plantilla original. Activa el destino **Biblioteca** con contenido real. Ver también `docs/plantillas de rutinas y memoria de progresión.md` (parte plantillas; memoria de pesos = 019).

## Criterios de aceptación

- [x] Schema: tablas de plantillas (p. ej. `routine_templates` + líneas de ejercicios) separadas de `rutinas`/`ejercicios` del alumno
- [x] Trainer puede crear/guardar plantilla (desde cero o desde una rutina de alumno existente)
- [x] Listar plantillas propias en `/trainer/library`
- [x] Asignar plantilla a un alumno → crea copia en `rutinas`/`ejercicios` del alumno (ownership validado)
- [x] Editar/borrar plantilla no muta rutinas ya asignadas
- [x] JWT + `requireRole('trainer')`; solo plantillas de `req.user.id`
- [x] Docs: `database-schema.md`, `api.md`, `data-flows.md`
- [x] Build frontend + API operativa local

## Fuera de alcance

- Memoria de último peso/reps en UI de ejecución (019)
- FK catálogo `exercises` (022)
- Plantillas globales del sistema (solo del trainer)
