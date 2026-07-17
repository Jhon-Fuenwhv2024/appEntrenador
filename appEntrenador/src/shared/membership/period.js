/**
 * Plan mensual Trainfit: fin = día anterior al mismo día del mes siguiente.
 * Ej. 2026-07-17 → 2026-08-16 (~30 días). Aritmética UTC (sin desfase TZ).
 */
export function monthlyPeriodEnd(dateOnly) {
  const raw = String(dateOnly || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
  const [y, m, d] = raw.split('-').map(Number);
  let ny = y;
  let nm = m + 1;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  const lastDayNext = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  const anniversary = Math.min(d, lastDayNext);
  const end = new Date(Date.UTC(ny, nm - 1, anniversary));
  end.setUTCDate(end.getUTCDate() - 1);
  const yy = end.getUTCFullYear();
  const mm = String(end.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(end.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function formatMembershipDate(dateOnly) {
  const raw = String(dateOnly || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '—';
  const [y, m, d] = raw.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

/** Días restantes hasta period_end (civil local). */
export function daysRemainingUntil(periodEnd) {
  const end = String(periodEnd || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [ys, ms, ds] = today.split('-').map(Number);
  const [ye, me, de] = end.split('-').map(Number);
  const a = Date.UTC(ys, ms - 1, ds);
  const b = Date.UTC(ye, me - 1, de);
  return Math.round((b - a) / 86400000);
}

/**
 * Normaliza membresía al ciclo de 30 días usando period_start.
 * Defensa en cliente si el API aún trae period_end antiguo (17→17).
 */
export function normalizeMembershipPeriod(membership) {
  if (!membership) return null;
  const start = String(membership.period_start || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return membership;
  const period_end = monthlyPeriodEnd(start);
  const days_remaining = daysRemainingUntil(period_end);
  return {
    ...membership,
    period_start: start,
    period_end,
    days_remaining,
  };
}
