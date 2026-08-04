# 083 · Inicio cliente context-aware

**Estado:** implementado  
**Depende de:** 038 (home immersivo), 040 (membresía), 042 (rachas), 043/057/064 (dieta), 032 (hábitos), 033/081 (check-in), 073 (chat unread), 075 (notificaciones), 041 (celebraciones)  
**Relacionada:** 052 (digest trainer — distinto), 053 (diario libre — fuera de alcance)

## Qué hace

Rediseña el **Inicio del cliente** para que reaccione al momento del alumno (membresía crítica, post-entreno, descanso, reenganche, día activo): jerarquía más clara, dieta compacta con **próxima comida**, adherencia **Comí / No comí**, acciones del día (agua, check-in, chat), macros planificados vs objetivo, insight semanal de una línea y digest email semanal al cliente (Resend vía mailer existente).

## Criterios de aceptación

### Modos de home

- [x] `membershipCritical` — membresía vencida o ≤3 días: banner CTA + soft-lock si aplica
- [x] `postWorkout` — rutina de hoy completada: copy de celebración + próxima comida destacada
- [x] `restDay` — sin rutina hoy: recuperación + hábitos / check-in
- [x] `reengage` — racha 0 con rutina hoy: copy de reenganche (no castigar con “0 días” como métrica hero)
- [x] `activeDay` — default: hero Empezar actual

### UI Inicio

- [x] Fila glanceable `HomeDayActions`: agua (toggle hábito agua si existe), kcal plan vs meta, chip check-in si due, chip chat si unread
- [x] Dieta compacta: card próxima comida + expandir a semana + lista
- [x] Macros: barras planificado (o eaten si hay adherence) vs objetivo
- [x] Check-in abrible desde Inicio (`WeeklyCheckinDialog`)
- [x] Micro-celebraciones al completar hábitos 100% / marcar comida / postWorkout (patrón 041, ligero)
- [x] Contraste ADR-0001/0002, focus-visible, ~390px, `--tf-bottom-nav-clearance`

### Backend — `GET /me/today` ampliado

- [x] `consistency` (resumen 042)
- [x] `checkinDue` + `lastCheckinAt` (sin check-in en últimos 7 días locales)
- [x] `chatPreview` (unread summary partner trainer)
- [x] `diet`: `nextMeal`, kcal/macros planificados del día, `mealAdherence[]`
- [x] `weekInsight` string por reglas

### Adherencia comidas

- [x] Tabla `diet_meal_adherence` (`client_id`, `diet_meal_id`, `local_date`, `status` eaten|skipped)
- [x] UNIQUE `(client_id, diet_meal_id, local_date)`
- [x] `PUT /me/diet-meals/:mealId/adherence` body `{ date, status }` — solo cliente dueño; soft-lock membresía

### Digest email cliente

- [x] Job semanal → email HTML corto (entrenos, racha, check-in pendiente, membresía)
- [x] Infra SMTP/Resend existente (`mailer.js`)

### Docs / validación

- [x] `docs/api.md` + `docs/data-flows.md`
- [x] Build FE OK; smoke backend

## Fuera de alcance

- Diario libre / barcode / fotos de plato (**053**)
- LLM coach-lite
- Digest / informe semanal al **trainer** (**052**)
- Cambiar tokens globales Vuetify
- White-label por trainer
