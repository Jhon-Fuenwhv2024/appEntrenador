/**
 * Feature 083 — deriva el modo del Inicio cliente desde el bundle de hoy.
 *
 * Membresía crítica (≤3 días / vencida) se comunica UNA sola vez vía banner.
 * El hero sigue centrado en el entrenamiento del día (salvo soft-lock).
 */
import { computed, toValue } from 'vue';
import { isMembershipAccessBlocked } from '../utils/membershipUi.js';

/**
 * @param {object} sources
 * @param {import('vue').MaybeRefOrGetter<object|null>} [sources.membership]
 * @param {import('vue').MaybeRefOrGetter<boolean>} [sources.membershipBlocked]
 * @param {import('vue').MaybeRefOrGetter<object|null>} [sources.todayRoutine]
 * @param {import('vue').MaybeRefOrGetter<boolean>} [sources.todayCompleted]
 * @param {import('vue').MaybeRefOrGetter<number|null>} [sources.currentStreak]
 * @param {import('vue').MaybeRefOrGetter<string>} [sources.heroMeta]
 */
export function useClientHomeMode(sources) {
  const membershipBlockedOrAccess = computed(() => {
    const membership = toValue(sources.membership);
    return Boolean(toValue(sources.membershipBlocked))
      || isMembershipAccessBlocked(membership);
  });

  const membershipCritical = computed(() => {
    if (membershipBlockedOrAccess.value) return true;
    const membership = toValue(sources.membership);
    const days = membership?.days_remaining == null
      ? null
      : Number(membership.days_remaining);
    return days != null && Number.isFinite(days) && days <= 3;
  });

  /** Modo de actividad del día (sin membresía). */
  const activityMode = computed(() => {
    const todayRoutine = toValue(sources.todayRoutine);
    const todayCompleted = Boolean(toValue(sources.todayCompleted));
    const streakRaw = toValue(sources.currentStreak);
    const currentStreak = streakRaw == null ? null : Number(streakRaw);

    if (todayCompleted && todayRoutine) return 'postWorkout';
    if (!todayRoutine) return 'restDay';
    if (currentStreak === 0) return 'reengage';
    return 'activeDay';
  });

  /**
   * Modo de producto: membershipCritical solo para banner.
   * Hero usa activityMode salvo soft-lock.
   */
  const mode = computed(() => (
    membershipCritical.value ? 'membershipCritical' : activityMode.value
  ));

  const heroMode = computed(() => (
    membershipBlockedOrAccess.value ? 'membershipLocked' : activityMode.value
  ));

  const heroEyebrow = computed(() => {
    switch (heroMode.value) {
      case 'membershipLocked':
        return 'Bloqueado';
      case 'postWorkout':
        return 'Completado';
      case 'restDay':
        return 'Recuperación';
      case 'reengage':
        return 'Retoma hoy';
      default:
        return 'Hoy';
    }
  });

  const heroTitle = computed(() => {
    const routine = toValue(sources.todayRoutine);
    switch (heroMode.value) {
      case 'restDay':
        return 'Día de descanso';
      case 'postWorkout':
        return routine?.nombre_rutina || 'Entrenamiento listo';
      case 'reengage':
        return routine?.nombre_rutina || 'Tu rutina';
      case 'membershipLocked':
        return routine?.nombre_rutina || 'Tu plan';
      default:
        return routine?.nombre_rutina || 'Entrenamiento';
    }
  });

  const heroMetaLine = computed(() => {
    const meta = toValue(sources.heroMeta) || '';

    switch (heroMode.value) {
      case 'membershipLocked':
        return 'Membresía vencida — habla con tu entrenador';
      case 'postWorkout':
        return 'Gran trabajo — ya entrenaste hoy. Sigue con tu próxima comida.';
      case 'restDay':
        return 'Sin rutina hoy · hidrátate, duerme y completa tus hábitos';
      case 'reengage':
        return meta
          ? `${meta} · Un entreno basta para volver`
          : 'Un entreno basta para volver a la racha';
      default:
        return meta;
    }
  });

  /** Un solo aviso de renovación en pantalla (banner con CTAs). */
  const showMembershipBanner = computed(() => membershipCritical.value);

  const celebratePostWorkout = computed(() => activityMode.value === 'postWorkout');

  const reengageTone = computed(() => activityMode.value === 'reengage');

  return {
    mode,
    activityMode,
    heroMode,
    heroEyebrow,
    heroTitle,
    heroMetaLine,
    showMembershipBanner,
    celebratePostWorkout,
    reengageTone,
  };
}
