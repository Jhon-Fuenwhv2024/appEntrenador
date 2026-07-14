# 020 · Perfil alumno (`alumnos_info`)

**Estado:** pendiente

**Depende de:** 017 (ficha/lista); schema ya en `script_db.sql`

## Qué hace

Conecta la tabla existente `alumnos_info` con API y UI: el trainer gestiona datos extendidos del alumno en la ficha; el cliente puede ver (y editar campos permitidos) su perfil. Sin mocks permanentes.

## Campos de dominio (schema actual)

- `telefono`, `fecha_nacimiento`, `sexo`, `lesiones`, `objetivo`, `foto_url`, `ultimo_acceso`

## Criterios de aceptación

- [ ] `GET/PUT` (o PATCH) perfil: trainer sobre alumno propio; client sobre `req.user.id`
- [ ] Crear fila `alumnos_info` si no existe (upsert) al guardar
- [ ] UI trainer en ficha alumno (sección Perfil)
- [ ] UI cliente: ver/editar campos acordados (p. ej. teléfono, objetivo, lesiones)
- [ ] Validación básica server-side; SQL parametrizado
- [ ] Docs api / database-schema / data-flows
- [ ] Build OK

## Fuera de alcance

- Upload real de foto (puede quedar `foto_url` textual o default)
- Onboarding obligatorio al registrarse (opcional post-MVP)
- Campos nuevos fuera del schema actual (salvo permiso DDL)
