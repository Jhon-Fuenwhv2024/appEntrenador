# Plan 031

1. Crear tabla `nutrition_targets` en `script_db.sql` + migración `014`.
2. Backend: GET/PUT `/api/nutrition/:clientId` en `modules/nutrition`.
3. Frontend: `NutritionTargetsPanel` para el entrenador (ficha alumno).
4. Frontend: `MacroSummaryCard` en el dashboard del cliente.
5. Auto-cálculo de calorías desde macros (P×4 + C×4 + F×9) con override manual.