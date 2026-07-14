# 023 · Plan

## Enfoque

1. Mover lógica de generate-token / consumo en register hacia `modules/invites` (register puede seguir en auth llamando al service de invites).
2. Endpoints: list + revoke; mantener compatibilidad de rutas públicas documentadas o alias.
3. Frontend: lista compacta + copiar link; reutilizar `InviteClientAction` evolucionado.
4. Actualizar architecture (objetivo `modules/invites` de AGENTS.md).

## Seguridad

- No exponer tokens de otros trainers.
- Revocar solo pendientes; usados quedan auditables en listado.
