# 017 · Alumnos como destino propio

**Estado:** hecha

**Depende de:** 016

## Qué hace

Convierte “Alumnos” en destino de primer nivel: lista dedicada en `/trainer/clients` (búsqueda, estado Activo/Sin plan, entrada a ficha). El dashboard (Inicio) deja de ser el único hogar de la lista: queda como hub de métricas, invitación y accesos rápidos.

## Criterios de aceptación

- [x] Ruta `/trainer/clients` lista alumnos del trainer autenticado (ownership `req.user.id`)
- [x] Muestra estado `Activo` (≥1 rutina) / `Sin plan` (reutilizar contrato de 015)
- [x] Búsqueda/filtro básico por nombre (client-side aceptable si el listado es pequeño)
- [x] Click → `/trainer/clients/:clientId` (rutinas/ficha existente)
- [x] Inicio: lista completa no es el foco principal (resumen corto o CTA “Ver alumnos” OK)
- [x] Bottom nav / sidebar “Alumnos” activo en lista y ficha
- [x] Sin cambios de schema; docs API/UI si hay endpoint nuevo o query params
- [x] Build frontend OK

## Fuera de alcance

- Perfil `alumnos_info` (020)
- Gestión avanzada de invitaciones (023)
- Plantillas (018)
- Búsqueda server-side / paginación (escalar cuando el listado completo pese)
