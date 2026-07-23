/**
 * Soft-expiry del plan SaaS del trainer (Feature 065) — mirror FE del helper BE.
 * Comparación por fecha calendario YYYY-MM-DD (sin hora).
 */

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function toDateOnlyString(value) {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const raw = String(value).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * @returns {string} YYYY-MM-DD (calendario local)
 */
export function todayDateOnlyString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {unknown} saasPlan
 * @param {unknown} saasExpirationDate
 * @param {string} [today]
 * @returns {{
 *   saas_plan: 'FREE'|'PRO',
 *   saas_expiration_date: string|null,
 *   effective_plan: 'FREE'|'PRO',
 *   is_expired: boolean
 * }}
 */
export function resolveEffectiveSaasPlan(
  saasPlan,
  saasExpirationDate,
  today = todayDateOnlyString(),
) {
  const plan = saasPlan === 'PRO' ? 'PRO' : 'FREE';
  const expiration = toDateOnlyString(saasExpirationDate);

  if (plan !== 'PRO') {
    return {
      saas_plan: 'FREE',
      saas_expiration_date: expiration,
      effective_plan: 'FREE',
      is_expired: false,
    };
  }

  if (!expiration) {
    return {
      saas_plan: 'PRO',
      saas_expiration_date: null,
      effective_plan: 'PRO',
      is_expired: false,
    };
  }

  const isExpired = expiration < today;

  return {
    saas_plan: 'PRO',
    saas_expiration_date: expiration,
    effective_plan: isExpired ? 'FREE' : 'PRO',
    is_expired: isExpired,
  };
}

/**
 * Texto relativo de vencimiento para backoffice.
 * @param {unknown} saasExpirationDate
 * @param {string} [today]
 * @returns {string|null}
 */
export function formatExpirationRelative(saasExpirationDate, today = todayDateOnlyString()) {
  const expiration = toDateOnlyString(saasExpirationDate);
  if (!expiration) return null;

  const [ty, tm, td] = today.split('-').map(Number);
  const [ey, em, ed] = expiration.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const expUtc = Date.UTC(ey, em - 1, ed);
  const diffDays = Math.round((todayUtc - expUtc) / 86_400_000);

  if (diffDays === 1) return 'Venció ayer';
  if (diffDays > 1) return `Venció hace ${diffDays} días`;
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === -1) return 'Vence mañana';
  return `Vence en ${Math.abs(diffDays)} días`;
}
