# 085 · Plan — Prescripción por serie

## Enfoque

1. Columna JSON `set_prescription` + ensure idempotente.
2. Normalización compartida backend; persistir en routines/templates.
3. UI builder + templates + payload.
4. Labels preview + prefill player.
5. Docs + build.

## Decisiones

- JSON nullable; `series`/`repeticiones`/`peso` se mantienen (resumen = serie 1).
- Descanso único por ejercicio.
- Shared helper FE/BE para parse/label/prefill.
