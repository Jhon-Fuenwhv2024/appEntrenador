/**
 * Helpers de UI para membresía del alumno (Feature 040).
 */

export function isMembershipAccessBlocked(membership) {
  if (!membership || !membership.block_on_unpaid) return false;
  const days = membership.days_remaining == null
    ? null
    : Number(membership.days_remaining);
  const notActive = membership.status !== 'active';
  const expiredByDate = days != null && days < 0;
  return notActive || expiredByDate;
}

export function isMembershipExpiringSoon(membership) {
  if (!membership || membership.status !== 'active') return false;
  const days = membership.days_remaining == null
    ? null
    : Number(membership.days_remaining);
  return days != null && days >= 0 && days <= 7;
}

/** Progreso visual 0–1 respecto a un mes de ~30 días. */
export function getMembershipProgress(membership) {
  const days = membership?.days_remaining == null
    ? null
    : Number(membership.days_remaining);
  if (days == null || !Number.isFinite(days)) return 0;
  if (days < 0) return 0;
  return Math.min(1, Math.max(0, days / 30));
}

/**
 * Estado visual unificado para la tarjeta moderna del dashboard.
 */
export function getMembershipHomeState(membership, forcedBlocked = false) {
  if (!membership?.status) return null;

  const days = membership.days_remaining == null
    ? null
    : Number(membership.days_remaining);
  const status = String(membership.status).toLowerCase();
  const blocked = forcedBlocked || isMembershipAccessBlocked(membership);
  const expiring = !blocked && isMembershipExpiringSoon(membership);
  const progress = getMembershipProgress(membership);

  if (blocked || status === 'expired' || (days != null && days < 0)) {
    return {
      tone: 'danger',
      title: 'Membresía vencida',
      headline: '0',
      unit: 'días',
      subtitle: 'Habla con tu entrenador para renovar',
      progress: 0,
      blocked: true,
      expiring: false,
    };
  }

  if (status === 'owing') {
    return {
      tone: 'warn',
      title: 'Pago pendiente',
      headline: days != null && days >= 0 ? String(Math.max(0, days)) : '—',
      unit: days != null && days >= 0 ? (days === 1 ? 'día' : 'días') : '',
      subtitle: 'Tu entrenador marcó un pago pendiente',
      progress,
      blocked: false,
      expiring: true,
    };
  }

  if (status === 'active') {
    const n = days == null ? null : Math.max(0, days);
    return {
      tone: expiring ? 'warn' : 'ok',
      title: 'Plan mensual',
      headline: n == null ? '—' : String(n),
      unit: n == null ? '' : (n === 1 ? 'día' : 'días'),
      subtitle: n == null
        ? 'Membresía al día'
        : (expiring
          ? `Quedan ${n === 1 ? '1 día' : `${n} días`}`
          : 'Plan mensual'),
      progress,
      blocked: false,
      expiring,
      days: n,
    };
  }

  return null;
}

/** @deprecated usar getMembershipHomeState */
export function getMembershipChip(membership) {
  const state = getMembershipHomeState(membership);
  if (!state) return null;
  return {
    label: state.title === 'Plan mensual' && state.days != null
      ? `Membresía: ${state.days} ${state.unit}`
      : state.title,
    color: state.tone === 'ok' ? 'success' : state.tone === 'warn' ? 'warning' : 'error',
    icon: 'mdi-card-account-details-outline',
  };
}
