/**
 * Soft-expiry del plan SaaS del trainer (Feature 065).
 * Comparación por fecha calendario YYYY-MM-DD (sin hora).
 * NULL en vencimiento = PRO sin caducidad. No muta DB.
 */

/**
 * @param {unknown} value
 * @returns {string|null} YYYY-MM-DD o null
 */
function toDateOnlyString(value) {
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
 * Hoy en calendario local del servidor (YYYY-MM-DD).
 * @returns {string}
 */
function todayDateOnlyString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {unknown} saasPlan
 * @param {unknown} saasExpirationDate
 * @param {string} [today] YYYY-MM-DD — inyectable para tests
 * @returns {{
 *   saas_plan: 'FREE'|'PRO',
 *   saas_expiration_date: string|null,
 *   effective_plan: 'FREE'|'PRO',
 *   is_expired: boolean
 * }}
 */
function resolveEffectiveSaasPlan(saasPlan, saasExpirationDate, today = todayDateOnlyString()) {
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

module.exports = {
  toDateOnlyString,
  todayDateOnlyString,
  resolveEffectiveSaasPlan,
};
