# 020 · Perfil alumno (`alumnos_info`)

**Estado:** implementado

**Depende de:** 017 (ficha/lista); schema ya en `script_db.sql`

## Qué hace

Conecta la tabla existente `alumnos_info` con API y UI: el trainer gestiona datos extendidos del alumno en la ficha; el cliente puede ver (y editar campos permitidos) su perfil. Sin mocks permanentes.

## Campos de dominio (schema actual)

- `telefono`, `fecha_nacimiento`, `sexo`, `lesiones`, `objetivo`, `foto_url`, `ultimo_acceso`

## Criterios de aceptación

- [x] `GET/PUT` (o PATCH) perfil: trainer sobre alumno propio; client sobre `req.user.id`
- [x] Crear fila `alumnos_info` si no existe (upsert) al guardar
- [x] UI trainer en ficha alumno (sección Perfil)
- [x] UI cliente: ver/editar campos acordados (p. ej. teléfono, objetivo, lesiones)
- [x] Validación básica server-side; SQL parametrizado
- [x] Docs api / database-schema / data-flows
- [x] Build OK

## Fuera de alcance (original; upload sí implementado por pedido)

- Onboarding obligatorio al registrarse (opcional post-MVP)
- Campos nuevos fuera del schema actual (salvo permiso DDL)
