# Plan 036

1. Actualizar esquema de BD para incluir `payment_status` y `next_due_date`.
2. Backend: Lógica de bloqueo en middleware si el cliente está moroso (opcional según config del entrenador).
3. Frontend: UI Entrenador para registrar pagos manuales.
4. Frontend: Modal de bloqueo (`<Teleport>`) para clientes morosos.