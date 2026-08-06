# ADR-0010 · Avatares privados vía Bearer + blob URL

**Estado:** aceptada  
**Fecha:** 2026-08-05  
**Relacionada:** [ADR-0004](ADR-0004-r2-avatars-trial.md), [ADR-0007](ADR-0007-persistent-auth-refresh-tokens.md)

## Contexto

Los avatares se sirven en `/uploads/avatars/...` con JWT (ADR-0004). El access token dura ~15m (ADR-0007). Un `<img src="...?token=JWT">` no puede refrescar el token: si el access ya expiró al primer paint, Express responde 401 JSON y el navegador muestra el icono de imagen rota, mientras Axios sí refresca y el resto de la UI carga bien.

Meter el access JWT en la query también es un anti-patrón (logs, historial, `Referer`).

## Decisión

1. La UI autenticada carga avatares con `fetch` + `Authorization: Bearer`, reintentando una vez tras `refreshSessionTokens` si hay 401.
2. El resultado se muestra como `blob:` URL (`useAuthenticatedAvatar` / `TfAvatar`).
3. Ante fallo: iniciales o asset por defecto (`@error`), nunca el broken-image del browser.
4. El contrato de servidor no cambia: proxy Express + JWT (Bearer o `?token=`). `?token=` queda como compatibilidad (p. ej. otros clientes); la app web deja de usarlo para avatares.
5. Cache en memoria de blob URLs por path; se limpia al logout; se invalida tras re-subir foto (`loadAccount({ force: true })`).

## Consecuencias

- El header de cuenta y listas de alumnos/chat ya no dependen de un JWT embebido en la URL del `<img>`.
- Fotos de progreso (`/uploads/photos`) siguen con `resolveMediaSrc` + `?token=` hasta un cambio similar si hace falta.
- Presigned R2 / media-token dedicado quedan fuera de alcance (candidatos en feature 068).
