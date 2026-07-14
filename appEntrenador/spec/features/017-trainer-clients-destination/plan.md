# 017 · Plan

## Enfoque

1. Extraer/componer vista `ClientsListView` (o equivalente) en `features/trainer/` montada en `/trainer/clients`.
2. Reutilizar `GET /api/clients` (+ status de 015); opcional query `q` solo si hace falta server-side.
3. Adelgazar `TrainerDashboardView`: stats + invite + link a Alumnos; evitar duplicar lista completa si se acuerda resumen.
4. Asegurar nav `clients` activa en lista y en `ClientRoutinesView`.
5. Docs breves en architecture / data-flows si cambia el flujo de entrada a la ficha.

## Component map (Vue)

- **ClientsListView** — composición de ruta: carga lista + estados.
- **ClientsList** (existente o evolucionado) — presentación + emit select.
- **TrainerDashboardView** — hub; deja de ser dueño exclusivo de la lista larga.
