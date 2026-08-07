# ADR-0009 — Modo sombra: Redis efímero + polling (sin historial)

## Estado

Aceptado (Feature 076)

## Contexto

El modo sombra necesita telemetría casi en tiempo real (ejercicio/fase) y cues one-way trainer→cliente mientras hay un entreno abierto. El plan original proponía tablas MySQL `live` + `cues` y polling. Requisitos de producto posteriores:

- Usar **Upstash Redis** (`ioredis`, `REDIS_URL` / `rediss://`).
- Minimizar comandos (plan free).
- **No guardar historial** de cues (solo mientras el alumno entrena).

## Decisión

1. **Redis** guarda el snapshot live (`shadow:live:{clientId}`, TTL 45s) y el índice por trainer (`shadow:idx:{trainerId}`).
2. **Cues efímeros** viven en `pendingCue` dentro del mismo documento Redis; se entregan en la respuesta del `PATCH /me/workout-live` del cliente (sin poll extra de cues).
3. **Rate-limit** de cues con `SET NX EX 10` en `shadow:rl:cue:{clientId}`.
4. **MySQL** solo persiste la preferencia `shadow_mode_enabled` (default ON).
5. **Sin** WebSocket/SSE/PubSub en MVP; poll trainer ~8s y solo con pestaña visible.
6. Si falta `REDIS_URL`, los endpoints live responden **503**; el resto de la app sigue.

## Consecuencias

- No hay revisión posterior de cues en ficha 360.
- La latencia es la del throttle cliente (~5s) + poll trainer (~8s).
- Multi-instancia API funciona vía Redis compartido (Upstash).
- Hay que vigilar el consumo de comandos Upstash free si hay muchos alumnos concurrentes.
