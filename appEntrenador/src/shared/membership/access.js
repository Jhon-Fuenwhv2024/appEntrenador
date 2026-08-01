/**
 * Reglas de acceso a rutinas por membresía (Feature 080+).
 * Bloqueo solo después del periodo + gracia — no por status "owing".
 */
export const MEMBERSHIP_ACCESS_GRACE_DAYS = 3;

/**
 * Días transcurridos después de period_end (0 si aún vigente).
 * days_remaining = DATEDIFF(period_end, hoy): 0 = último día, -1 = un día después.
 */
export function getDaysPastPeriodEnd(daysRemaining) {
  if (daysRemaining == null || daysRemaining === '') return null;
  const d = Number(daysRemaining);
  if (!Number.isFinite(d)) return null;
  if (d >= 0) return 0;
  return -d;
}

/**
 * true si ya pasaron más de `graceDays` días después de period_end.
 * Con gracia 3: días -1,-2,-3 aún en gracia; -4+ bloquea.
 */
export function isMembershipPastGrace(daysRemaining, graceDays = MEMBERSHIP_ACCESS_GRACE_DAYS) {
  const past = getDaysPastPeriodEnd(daysRemaining);
  if (past == null) return false;
  return past > graceDays;
}

/** Periodo terminado pero aún dentro de los días de gracia. */
export function isMembershipInGrace(daysRemaining, graceDays = MEMBERSHIP_ACCESS_GRACE_DAYS) {
  const past = getDaysPastPeriodEnd(daysRemaining);
  if (past == null || past === 0) return false;
  return past >= 1 && past <= graceDays;
}

/**
 * Soft-lock: solo con block_on_unpaid y periodo fuera de la gracia.
 * Pendiente (owing) con plan vigente NO bloquea.
 */
export function isMembershipAccessBlocked(membership, graceDays = MEMBERSHIP_ACCESS_GRACE_DAYS) {
  if (!membership || !membership.block_on_unpaid) return false;
  return isMembershipPastGrace(membership.days_remaining, graceDays);
}

/** Días de gracia restantes (incl. hoy), o 0 si no aplica / ya acabó. */
export function getMembershipGraceDaysLeft(daysRemaining, graceDays = MEMBERSHIP_ACCESS_GRACE_DAYS) {
  const past = getDaysPastPeriodEnd(daysRemaining);
  if (past == null || past === 0) return 0;
  return Math.max(0, graceDays - past + 1);
}
