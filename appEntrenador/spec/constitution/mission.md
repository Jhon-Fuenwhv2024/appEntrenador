# Misión

## Qué construimos

**Trainfit** es una plataforma web responsive para entrenadores personales y sus clientes: el entrenador gestiona alumnos e invitaciones; el cliente accede a su portal (rutinas y datos).

1. **Portal entrenador** — login, listado de clientes, generación de invitaciones, (futuro) asignación de rutinas.
2. **Portal cliente** — registro por invitación, acceso a su dashboard y rutinas asignadas.
3. **API + MySQL** — autenticación, datos de usuarios/clientes y, a continuación, rutinas/ejercicios.

## Para quién

- **Entrenador personal** — necesita gestionar alumnos sin hojas de cálculo ni chats dispersos.
- **Cliente / alumno** — necesita ver qué entrenar y sus datos de forma clara en móvil o escritorio.
- **Desarrollador / agente** — debe poder extender el producto con specs y arquitectura modular.

## Principios

- **Dos roles claros** — `trainer` y `client` con superficies de UI y permisos distintos; el servidor valida el rol.
- **Specs primero** — features nuevas pasan por `spec/` (spec → plan → tasks) antes de código grande.
- **Modular y gradual** — organizar por features/módulos sin reescribir todo de golpe.
- **Datos reales sobre mocks** — si la tabla existe en MySQL, conectar la UI; no dejar mocks permanentes.
- **Mobile-friendly** — la experiencia principal debe funcionar en pantallas pequeñas.

## Qué NO es

- No es una red social fitness ni un marketplace de entrenadores.
- No es (aún) una app nativa; es una SPA web responsive.
- No pretende ser un ERP completo (facturación, inventario de gimnasio, etc.) en el MVP.
