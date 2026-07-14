# 018 · Plan

## Enfoque

1. **Diseño DDL (Base de Datos):** Crear tablas `RoutineTemplates` y `TemplateExercises`. Ambas deben estar protegidas por `trainer_id` (Propiedad). 
2. **Módulo Backend (`templates`):** Implementar arquitectura estricta Route → Controller → Service. 
   - **CRÍTICO:** El proceso de asignación y creación que involucre múltiples tablas DEBE usar transacciones SQL (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) y Prepared Statements.
3. **Endpoints de la API:** 
   - `GET/POST /api/templates` (Listar/Crear).
   - `GET/PATCH/DELETE /api/templates/:id` (CRUD de la plantilla).
   - `POST /api/templates/:id/assign` (Body: `{ clientId, dia_semana? }`).
4. **Frontend (`LibraryView`):** Montado en `/trainer/library`.
   - Uso estricto de Vue 3 Composition API.
   - Dividir en componentes enfocados: Lista de plantillas, Formulario de creación/edición, y Modal de asignación (`AssignDialog`).
5. **Mantenimiento:** Actualizar `script_db.sql` con el nuevo DDL e inyectar datos de prueba iniciales (opcional).

## Decisiones Arquitectónicas

- **Asignar = Copia profunda (Deep Copy).** No es una referencia viva a la base. Al asignar, el backend clona la plantilla y crea una nueva instancia en la tabla de rutinas del cliente.
- **Prescripción de Carga:** El peso/reps indicados en la plantilla base funcionan como una "prescripción por defecto". El historial real y las modificaciones de ejecución del cliente vivirán aislados en su propio `workout_log`.
- Peso en línea de plantilla = prescripción por defecto; historial de ejecución sigue en `workout_*` (012/019).
