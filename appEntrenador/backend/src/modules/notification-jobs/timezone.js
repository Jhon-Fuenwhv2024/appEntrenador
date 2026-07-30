/**
 * Timezone helpers (Intl only — no extra npm deps).
 * Weekday labels match rutinas.dia_semana ENUM (with accents).
 */

/** Sunday-first index aligned with Date#getUTCDay(). */
const DAYS_BY_UTC_WEEKDAY = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const DEFAULT_TIMEZONE = 'America/Bogota';

/**
 * Weekday label (es) from civil YYYY-MM-DD without TZ shift.
 * Same approach as routines.service weekdayLabelFromLocalDate.
 */
function weekdayLabelFromLocalDate(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return 'Lunes';
  const utcWeekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAYS_BY_UTC_WEEKDAY[utcWeekday];
}

function isValidTimeZone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function normalizeTimeZone(timeZone) {
  const tz = typeof timeZone === 'string' ? timeZone.trim() : '';
  return isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
}

/**
 * Civil date / clock parts in the given IANA timezone.
 * @returns {{ hour: number, minute: number, dateStr: string, weekdayEs: string }}
 */
function getZonedParts(timeZone) {
  const tz = normalizeTimeZone(timeZone);
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const year = get('year');
  const month = get('month');
  const day = get('day');
  let hour = Number(get('hour'));
  const minute = Number(get('minute'));

  // Some engines report midnight as 24 with hourCycle h23.
  if (hour === 24) hour = 0;

  const dateStr = `${year}-${month}-${day}`;
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
    dateStr,
    weekdayEs: weekdayLabelFromLocalDate(dateStr),
  };
}

/**
 * YYYY-MM-DD of an instant in the given timezone.
 */
function toZonedDateStr(dateInput, timeZone) {
  const tz = normalizeTimeZone(timeZone);
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Add (or subtract) calendar days to a civil YYYY-MM-DD string.
 */
function addDaysToDateStr(dateStr, delta) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(delta || 0));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

module.exports = {
  DAYS_BY_UTC_WEEKDAY,
  DEFAULT_TIMEZONE,
  weekdayLabelFromLocalDate,
  isValidTimeZone,
  normalizeTimeZone,
  getZonedParts,
  toZonedDateStr,
  addDaysToDateStr,
};
