# ADR-0007 — Sesión persistente con access JWT + refresh token

**Estado:** aceptado  
**Fecha:** 2026-08-03  
**Feature:** [083-persistent-auth-refresh-tokens](../../spec/features/083-persistent-auth-refresh-tokens/spec.md)

## Contexto

Trainfit autentica con un único JWT (`JWT_EXPIRES_IN`, tip. `8h`) en `localStorage`. Al vencer, el interceptor Axios trata cualquier `401` como fin de sesión y obliga a volver a login. Eso choca con el uso diario de clientes (PWA / móvil) que no deberían reautenticarse cada día si no cerraron sesión.

Las guías actuales para SPAs (access corto + refresh largo, rotación, reuse detection; idealmente refresh en cookie HttpOnly o BFF) deben equilibrarse con el stack existente: Vue + Express en orígenes distintos, Bearer para SSE y media privada, MySQL sin Redis/BFF.

## Decisión

1. **Access token:** JWT corto (default `15m`), mismo contrato Bearer / `?token=` que hoy.
2. **Refresh token:** opaco, hasheado SHA-256 en tabla `refresh_tokens`, TTL `30d` con rotación en cada uso.
3. **Logout:** revoca refresh en servidor + limpia storage en cliente.
4. **Almacenamiento refresh en MVP (Fase A):** respuesta JSON + `localStorage` (misma superficie XSS que el JWT actual), para no bloquear en CORS/`credentials`.
5. **Mejora posterior (Fase B):** mover refresh a cookie `HttpOnly; Secure; SameSite=None` con `credentials: true` cuando el despliegue lo permita de forma estable.

**No** se alarga el access JWT a 30 días como única medida (amplía ventana de robo y no permite revocar en logout).

## Consecuencias

- Positivo: UX de sesión continua; logout real; access corto limita daño de Bearer filtrado.
- Positivo: compatible con middleware y módulos actuales.
- Negativo (Fase A): refresh en `localStorage` sigue expuesto a XSS → mitigar con CSP/higiene FE; Fase B lo mejora.
- Negativo: más complejidad en interceptor (single-flight) y tabla a limpiar (tokens vencidos).
- Mitigación multi-pestaña: `navigator.locks` + ventana de gracia (~60s) si un refresh recién rotado se reutiliza por carrera; presence (`/push/presence`) no fuerza logout si el refresh falla.
- Fuera: BFF + sesión server-only queda como evolución si el producto exige cumplimiento más estricto.
