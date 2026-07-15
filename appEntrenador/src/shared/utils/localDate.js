/**
 * Fecha civil local del navegador como YYYY-MM-DD.
 * NO usar toISOString(): convierte a UTC y puede cambiar el día.
 */
export function formatLocalDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
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
