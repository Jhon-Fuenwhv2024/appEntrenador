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

## Actividad (barras semanales)

Agrupa sesiones **completadas** por semana local (lunes–domingo). La etiqueta del eje X es el **último día ya transcurrido** de esa semana (domingo en semanas cerradas; **hoy** en la semana actual), no el lunes de inicio — así una sesión del martes 28 no aparece etiquetada como “27”. El tooltip muestra el rango completo (`Semana 27 jul – 28 jul`).

Timestamps de sesión se interpretan en zona local del dispositivo (`coerceDate` / `formatLocalDate`); no usar `toISOString().slice(0, 10)` para el día civil.

## Trainer

`ProgressChartsPanel` sigue igual por defecto (`rangeDays: null` = series completas). Props opcionales `enableRangeFilter`, `hideActivity`, `rangeDays` no afectan Client 360 si no se pasan.
