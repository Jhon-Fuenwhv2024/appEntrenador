# SKILL: Auth, Roles & Security

## Objetivo principal

Como agente de IA, DEBES aplicar estas reglas cada vez que leas, modifiques o crees código de autenticación, sesiones, roles o protección de datos. La prioridad es el aislamiento estricto por identidad y rol: un cliente nunca ve ni muta datos de otro; un trainer solo opera sobre su dominio.

## 1. Modelo asimétrico (Trainer vs Client)

- Roles válidos: `trainer` | `client`.
- Superficies y permisos distintos por rol; no mezclar lógica de portal entrenador y portal cliente.
- El servidor valida el rol en cada endpoint sensible; nunca confiar solo en `localStorage`, claims del frontend o flags del body.
- Registro público / por invitación siempre crea `rol = 'client'`. Los trainers no se auto-registran.

## 2. Identidad de request (`req.user`)

- Tras autenticar, el middleware debe poblar `req.user` (mínimo: `id`, `rol`).
- Toda consulta o mutación de datos personales debe filtrar por el ID del usuario autenticado (`req.user.id`) o por la relación trainer↔client validada en servidor.
- Prohibido aceptar `userId` / `clientId` del body o query como fuente de verdad sin contrastarlo con `req.user` y las reglas de ownership.

## 3. Aislamiento estricto de datos

- **Client:** solo lee/actualiza sus propios recursos (perfil, rutinas asignadas, etc.).
- **Trainer:** solo opera sobre alumnos vinculados a su dominio; no listar ni mutar usuarios ajenos.
- Ante acceso no autorizado: responder `403` (o `404` si se prefiere no revelar existencia) con el formato JSON unificado del proyecto.
- No exponer hashes de contraseña ni tokens internos en respuestas.

## 4. Auth y sesiones

- Preferir JWT o sesión server-side cuando la feature lo defina; hasta entonces, cualquier endpoint nuevo no debe quedar “abierto porque es local”.
- Secrets y claves solo vía variables de entorno; nunca hardcodear en código ni commitear `.env*`.
- Invalidar / quemar tokens de invitación tras uso; no reutilizar tokens usados.

## 5. Checklist antes de cerrar un cambio de auth/seguridad

- [ ] Middleware de auth/roles aplicado donde corresponde.
- [ ] Filtros por `req.user.id` / ownership en service (no solo en UI).
- [ ] Sin SQL concatenado; prepared statements.
- [ ] Respuestas de error con `{ success: false, error, code }`.
- [ ] Sin secretos en logs ni en respuestas.
