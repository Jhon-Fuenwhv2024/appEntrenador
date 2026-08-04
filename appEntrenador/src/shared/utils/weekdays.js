/**
 * Weekday labels matching rutinas.dia_semana ENUM (es, with accents).
 */
export const WEEKDAYS_ES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

/** Local weekday label for a Date (browser TZ), aligned with rutinas.dia_semana. */
export function weekdayLabelFromDate(date = new Date()) {
  const raw = date.toLocaleDateString('es-ES', { weekday: 'long' });
  const normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return WEEKDAYS_ES.find((d) => d.toLowerCase() === normalized.toLowerCase()) || normalized;
}

/** Today’s weekday label in the device local timezone. */
export function todayWeekdayLabel() {
  return weekdayLabelFromDate(new Date());
}

/**
 * True when the routine is scheduled for the given civil day (default: today local).
 * @param {{ dia_semana?: string }|null|undefined} routine
 * @param {Date} [date]
 */
export function isRoutineScheduledForDate(routine, date = new Date()) {
  const day = typeof routine?.dia_semana === 'string' ? routine.dia_semana.trim() : '';
  if (!day) return false;
  return day === weekdayLabelFromDate(date);
}
