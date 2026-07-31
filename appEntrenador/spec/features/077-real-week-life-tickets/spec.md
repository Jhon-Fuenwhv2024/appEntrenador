# 077 · Tickets de “semana real” — rescate de plan ante la vida

**Estado:** especificado (sin implementar)  
**Depende de:** 061 (programación semanal trainer), 038/066 (Hoy / rutina del día), 042 (rachas), 075 (notificaciones)  
**Relacionada:** 018 (plantillas), 040 (membresía), 076 (modo sombra — opcional)

## Qué hace

El **alumno** declara un evento de vida que rompe la semana ideal (viaje, fiesta, lesión leve, exámenes, noche mala, carga laboral). El sistema propone **2–3 planes de rescate** predefinidos por el entrenador; el trainer **aprueba con un toque** y la programación de los días afectados se reescribe automáticamente.

Diferenciador frente a apps AI: el humano mantiene el veto; no hay “la IA me cambió el plan sola”.

## Personas

| Rol | Necesidad |
|-----|-----------|
| Client | Seguir entrenando sin culpa ni abandonar el plan cuando la vida pasa |
| Trainer | Adaptar sin reescribir a mano ni perder el hilo del mesociclo |

## Decisiones de producto

- **Ticket = solicitud estructurada**, no un mensaje libre en chat (aunque puede enlazar al chat).
- **Tipos MVP:** `travel` | `social` | `minor_injury` | `exams` | `poor_sleep` | `work_overload` | `other`.
- **Ventana:** fecha inicio/fin (1–14 días); afecta solo días con rutina asignada en esa ventana.
- **Rescates:** el trainer configura plantillas de rescate por tipo (ej. “viaje → full body 20 min / home”; “lesión hombro → quitar presses”).
- **Aprobación:** estados `pending` → `approved` | `rejected` | `expired`.
- **Sin auto-apply en MVP** salvo preferencia explícita del trainer “auto-aprobar tipo X”.
- **Racha (042):** un ticket aprobado con rescate completado **no rompe** la racha; un ticket sin rescate (solo “pausa”) puede marcar días como `excused`.
- **Notificación:** trainer al crear ticket; cliente al aprobar/rechazar.

## Criterios de aceptación

### Producto / UX

- [ ] Cliente: crear ticket (tipo, fechas, nota corta, zona corporal si lesión)
- [ ] Cliente: ver estado y qué días se modificaron tras aprobación
- [ ] Trainer: bandeja de tickets pendientes (desde Inicio / ficha 360)
- [ ] Trainer: elegir uno de los rescates sugeridos o “solo excusar (no entrenar)”
- [ ] Trainer: biblioteca mínima de plantillas de rescate por tipo
- [ ] Tras approve: días afectados reflejan el rescate en “Hoy” y en programación 061
- [ ] Empty / edge: sin plantilla → trainer debe elegir acción manual o rechazar con motivo
- [ ] Contraste / a11y / móvil ~390px / bottom-nav clearance

### Backend

- [ ] CRUD tickets + approve/reject con ownership
- [ ] Aplicación transaccional del rescate a la programación del cliente
- [ ] Route → Controller → Service; SQL parametrizado

### Docs (al implementar)

- [ ] `docs/api.md` + `docs/data-flows.md`

## Fuera de alcance

- Adaptación automática por wearables / HRV / sueño de terceros
- Reescritura de dieta (043/064) en el mismo ticket (fase 2 posible)
- IA generativa de rescates
- Tickets grupales / challenges
- Calendario de citas 1:1
