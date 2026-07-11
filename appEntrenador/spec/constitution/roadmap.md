# Roadmap

## Hecho

1. **Auth básica + invitaciones** — login, registro con token, roles `trainer` / `client`, listado de clientes (`GET /api/clients`). (Código legado previo a SDD; sin carpeta `features/` histórica.)
2. **001 · Modularizar auth y API compartida** — cliente Axios compartido, auth en `features/auth` y backend auth en `modules/auth`, sin cambiar el comportamiento visible.
3. **002 · Modularizar clientes y portal entrenador** — `GET /api/clients` en `modules/clients` y dashboard entrenador bajo `features/trainer`.

## Siguiente

4. **Auth server-side (JWT o sesión)** — middleware de auth/roles; dejar de confiar solo en `localStorage`.
5. **CRUD rutinas y ejercicios** — conectar schema existente al portal entrenador y cliente.

## Backlog / ideas

- **Perfil alumno (`alumnos_info`)** — API y UI de datos extendidos.
- **Config por entorno** — `.env` para DB y `VITE_API_URL`; quitar credenciales hardcodeadas.
- **Pinia / TypeScript** — solo si el estado o el tamaño del equipo lo justifican.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.
