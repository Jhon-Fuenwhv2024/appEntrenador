# Feature 072 — Rediseño UX “Mi progreso”

## Cambio de UI

La vista cliente `/client/progress` deja de usar tabs **Resumen / Gráficas**. Pasa a **single scroll** con este orden:

1. **Resumen** (`ProgressHeroCard`) — racha (+ mejor), sesiones 7d, delta de peso; CTA check-in
2. **Tendencias** — chips 7/30/90, actividad, gráficas peso/IMC y fuerza
3. **Sesiones** — últimos entrenamientos
4. **Logros** — PRs (`PersonalRecordsSection`)
5. **Composición corporal** — read-only
6. **Historial** — sesiones anteriores por mes

Nav de anclas sticky horizontal: Resumen · Tendencias · Sesiones · Logros · Composición · Historial.

## APIs

Sin endpoints nuevos. Reutiliza `/me/workout-sessions`, `/me/consistency`, `/me/personal-records`, `/me/body-composition`, `/progress/metrics`, `/progress/exercises`. El rango 7/30/90 se filtra en cliente.

## Trainer

`ProgressChartsPanel` sigue igual por defecto (`rangeDays: null` = series completas). Props opcionales `enableRangeFilter`, `hideActivity`, `rangeDays` no afectan Client 360 si no se pasan.
