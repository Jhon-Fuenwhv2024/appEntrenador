# 078 · Radar de ocupación del gym — swaps gobernados + analytics

**Estado:** especificado (sin implementar)  
**Depende de:** 011/059 (Workout Player), 008/009/022 (catálogo + `exercise_id`), 018 (plantillas), 061 (programación)  
**Relacionada:** 019 (progresión), 012 (logs de sesión), 046 (muscle tags — útil para sugerir patrón)

## Qué hace

En el Workout Player, el alumno marca **“máquina / material ocupado”**. Solo puede elegir **alternativas preaprobadas por el entrenador** (por ejercicio o por patrón). Cada swap se registra con motivo `equipment_busy`. El trainer ve un **radar/analytics**: qué ejercicios se sustituyen más y con qué, para reprogramar con datos reales del gym.

Diferenciador: no es un swap libre ni IA genérica; es **ocupación reportada + gobierno del coach + telemetría de programación**.

## Personas

| Rol | Necesidad |
|-----|-----------|
| Client | No quedarse parado ni romper el estímulo del día |
| Trainer | Saber qué se cae en el mundo real y ajustar la biblioteca / plan |

## Decisiones de producto

- **Motivo MVP:** solo `equipment_busy` (otros motivos → fase 2: dolor, preferencia, sin material en casa).
- **Alternativas:** definidas por el trainer a nivel ejercicio de catálogo y/o override por línea de rutina.
- **Máximo:** hasta 5 alternativas ordenadas por preferencia del trainer.
- **Sin alternativas:** el alumno puede “saltar ejercicio” (queda logueado como skipped_busy) o esperar; no catálogo libre en MVP.
- **Progresión (019):** el log del swap usa el `exercise_id` **efectivo**; el original queda en metadata del swap.
- **Analytics trainer:** top ejercicios “ocupados”, tasa de swap por alumno/plan, pares origen→destino.
- **Ventana analytics:** 7 / 30 / 90 días.

## Criterios de aceptación

### Producto / UX

- [ ] Player: acción “Ocupado” en el ejercicio actual
- [ ] Sheet con alternativas aprobadas (nombre + media si existe) + confirmación
- [ ] Tras swap: el resto de la sesión usa el ejercicio elegido; series se registran contra él
- [ ] Trainer: UI para definir alternativas en catálogo / builder de rutina
- [ ] Trainer: vista Radar (lista/heatmap simple) con filtros de periodo
- [ ] Ficha 360: indicador suave si el alumno swappea mucho (> umbral)
- [ ] Contraste / a11y (`aria-label` en icon-buttons) / ~390px / bottom-nav

### Backend

- [ ] Persistencia de alternativas (trainer) con ownership
- [ ] Registro de eventos de swap ligados a sesión/set
- [ ] Endpoint analytics agregado solo para alumnos del trainer
- [ ] Route → Controller → Service; SQL parametrizado

### Docs (al implementar)

- [ ] `docs/api.md` + `docs/data-flows.md`

## Fuera de alcance

- Visión por cámara / escáner de máquina (estilo Tenax)
- Mapa físico del gimnasio / IoT
- Crowdsourcing entre alumnos de distintos trainers
- Auto-reprogramar la plantilla semanal sin confirmación del trainer
- Swaps por dolor/lesión (usar 077 tickets)
