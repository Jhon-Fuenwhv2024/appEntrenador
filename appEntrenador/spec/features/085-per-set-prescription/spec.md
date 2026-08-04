# 085 · Prescripción por serie (peso + reps)

**Estado:** implementado  
**Depende de:** 005/006 (rutinas), 018 (plantillas), 011/059 (player), 061/084 (builder)  
**Alimenta:** Programación trainer, plantillas, preview, Workout Player

## Qué hace

Permite definir **peso y repeticiones distintos por cada serie** de un ejercicio, sin depender solo de notas.

## Criterios de aceptación

- [x] Columna `set_prescription` JSON en `ejercicios` y `template_exercises`
- [x] CRUD rutinas + plantillas + assign conservan la prescripción
- [x] Sin `set_prescription` → comportamiento legacy (mismo peso/reps)
- [x] Builder: personalizar por serie (Serie | Reps | Kg)
- [x] Preview muestra label variable o uniforme
- [x] Player prefill/checklist/up-next por número de serie
- [x] Build FE OK

## Fuera de alcance

- Descanso por serie, RPE/RIR/tempo
