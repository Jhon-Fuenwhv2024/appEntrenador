# 059 · Workout Player híbrido (media + series + rest)

**Estado:** implementado  
**Depende de:** 011 (Workout Player UI), 010 (motor), 028 (rest timer), 029 (superseries), 038 (piel inmersiva)  
**Relacionada:** 019 (`last_log`), 041 (PRs), 058 (preview)

## Qué hace

Rediseña la visualización del modo ejecución (tras **Empezar** → **Comenzar entrenamiento**) con un enfoque híbrido: se mantiene el wizard con **media grande** del coach y se añade un **checklist de series** del ejercicio actual más un descanso con **anillo**, **±15 s** y **Up next**. No cambia dominio ni contratos de API de sesión.

## Criterios de aceptación

### Frontend

- [x] Fase `working`: media + checklist (Set | Anterior | kg×reps | estado) + CTA Completar serie
- [x] Filas done marcadas; inputs en la serie actual
- [x] Header con duración de sesión (`tabular-nums`)
- [x] Fase `resting`: anillo de progreso, −15 / +15, Omitir, Up next legible
- [x] Audio/vibración y wall-clock (ADR-0002) intactos
- [x] Superseries 029 sin regresión (motor intacto)
- [x] Contraste Trainfit (`on-primary`); safe-area; ~390px sin overflow

### Backend

- Sin cambios (mismo `POST /me/workout-sessions`)

### Fuera de alcance

- Editar series ya guardadas
- Abandonar / pausar sesión
- Tabla multi-ejercicio estilo Hevy
- Cambiar tokens globales del tema
