/**
 * Formato de moneda COP para membresías (Feature 079).
 */
export function formatMoneyCop(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Saldo pendiente derivado: max(0, plan_price - amount_paid).
 */
export function computeAmountDue(planPrice, amountPaid = 0) {
  if (planPrice == null || planPrice === '') return null;
  const price = Number(planPrice);
  if (!Number.isFinite(price)) return null;
  const paid = Number(amountPaid);
  const due = Math.max(0, price - (Number.isFinite(paid) ? paid : 0));
  return Math.round(due * 100) / 100;
}
