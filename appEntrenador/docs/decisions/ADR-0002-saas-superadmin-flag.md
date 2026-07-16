# ADR-0002 · SuperAdmin como flag, no como rol

## Estado

Aceptado (Feature 037 Fase 1).

## Contexto

Hace falta un dueño de plataforma con panel `/backoffice` y gestión de planes FREE/PRO, sin romper el modelo asimétrico `trainer` | `client`.

## Decisión

- SuperAdmin = `usuarios.is_superadmin` (BOOLEAN), claim JWT y sesión frontend.
- No se añade `admin` al ENUM `rol`.
- Planes viven en `trainers_info.saas_plan` / `saas_expiration_date`.
- Límite FREE se aplica en `POST /api/invites` (alumnos + invites pending ≥ 3 → 402).

## Consecuencias

- El dueño se provisiona con SQL manual (`UPDATE ... is_superadmin = TRUE`).
- Constituciones y skills siguen hablando de dos roles de producto; el flag es infraestructura de plataforma.
