/**
 * Fecha civil local del navegador como YYYY-MM-DD.
 * NO usar toISOString(): convierte a UTC y puede cambiar el día.
 */
export function formatLocalDate(date = new Date()) {
  const d = coerceDate(date);
  if (!d) {
    throw new Error('Fecha inválida');
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Hoy en zona horaria local del dispositivo. */
export function todayLocalDate() {
  return formatLocalDate(new Date());
}

/**
 * Parsea timestamps de API/MySQL a Date local del dispositivo.
 * ISO con Z / offset → instante absoluto (correcto).
 * "YYYY-MM-DD HH:mm:ss" sin zona (DATETIME UTC del server) → se interpreta como UTC
 * para no adelantar/atrasar el día civil en zonas como UTC−5.
 */
export function coerceDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // MySQL DATETIME / TIMESTAMP string sin zona → UTC del servidor Trainfit.
  const mysqlUtc = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/,
  );
  if (mysqlUtc) {
    const [, y, mo, d, h, mi, s] = mysqlUtc;
    const utc = new Date(Date.UTC(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
    ));
    return Number.isNaN(utc.getTime()) ? null : utc;
  }

  // Date-only: día civil, sin shift por TZ.
  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** YYYY-MM-DD local a partir de un timestamp de sesión/API. */
export function toLocalDateKey(value) {
  const d = coerceDate(value);
  if (!d) return null;
  return formatLocalDate(d);
}

/** Etiqueta corta local: "28 jul". */
export function formatShortDayMonth(date) {
  const d = coerceDate(date);
  if (!d) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
