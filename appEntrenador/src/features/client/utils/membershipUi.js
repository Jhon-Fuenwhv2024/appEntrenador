/**
 * Helpers de UI para membresía del alumno (Feature 040 + 080).
 */
import {
  getMembershipGraceDaysLeft,
  isMembershipAccessBlocked,
  isMembershipInGrace,
  isMembershipPastGrace,
  MEMBERSHIP_ACCESS_GRACE_DAYS,
} from '../../../shared/membership/access.js';

export {
  isMembershipAccessBlocked,
  isMembershipInGrace,
  isMembershipPastGrace,
  getMembershipGraceDaysLeft,
  MEMBERSHIP_ACCESS_GRACE_DAYS,
};

export function isMembershipExpiringSoon(membership) {
  if (!membership || membership.status !== 'active') return false;
  const days = membership.days_remaining == null
    ? null
    : Number(membership.days_remaining);
  return days != null && days >= 0 && days <= 7;
}

/** Progreso visual 0–1 respecto a un mes de ~30 días. */
export function getMembershipProgress(membership) {
  if (!membership) return 0;
  const status = String(membership.status || '').toLowerCase();
  if (status === 'expired' || isMembershipAccessBlocked(membership)) return 0;
  if (isMembershipInGrace(membership.days_remaining)) return 0;

  const days = membership.days_remaining == null
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
  const inGrace = !blocked && isMembershipInGrace(days);
  const expiring = !blocked && !inGrace && isMembershipExpiringSoon(membership);
  const progress = getMembershipProgress(membership);
  const periodEnded = status === 'expired' || (days != null && days < 0);

  if (blocked) {
    return {
      tone: 'danger',
      title: 'Membresía vencida',
      headline: '0',
      unit: 'días',
      subtitle: 'Habla con tu entrenador para renovar',
      progress: 0,
      blocked: true,
      inGrace: false,
      expiring: false,
    };
  }

  if (inGrace) {
    const graceLeft = getMembershipGraceDaysLeft(days);
    return {
      tone: 'warn',
      title: 'Periodo de gracia',
      headline: String(graceLeft),
      unit: graceLeft === 1 ? 'día' : 'días',
      subtitle: graceLeft === 1
        ? 'Último día de acceso — renueva con tu entrenador'
        : `Te quedan ${graceLeft} días de acceso — renueva con tu entrenador`,
      progress: 0,
      blocked: false,
      inGrace: true,
      expiring: true,
      graceDaysLeft: graceLeft,
    };
  }

  if (periodEnded) {
    return {
      tone: 'danger',
      title: 'Membresía vencida',
      headline: '0',
      unit: 'días',
      subtitle: 'Habla con tu entrenador para renovar',
      progress: 0,
      blocked: false,
      inGrace: false,
      expiring: false,
    };
  }

  if (status === 'owing') {
    return {
      tone: 'warn',
      title: 'Pago pendiente',
      headline: days != null && days >= 0 ? String(Math.max(0, days)) : '—',
      unit: days != null && days >= 0 ? (days === 1 ? 'día' : 'días') : '',
      subtitle: membership.amount_due > 0
        ? 'Hay un monto por pagar; regularízalo con tu entrenador'
        : 'Tu entrenador marcó un pago pendiente',
      progress,
      blocked: false,
      inGrace: false,
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
      inGrace: false,
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
    label: state.inGrace
      ? `Gracia: ${state.headline} ${state.unit}`
      : (state.title === 'Plan mensual' && state.days != null
        ? `Membresía: ${state.days} ${state.unit}`
        : state.title),
    color: state.tone === 'ok' ? 'success' : state.tone === 'warn' ? 'warning' : 'error',
    icon: 'mdi-card-account-details-outline',
  };
}
