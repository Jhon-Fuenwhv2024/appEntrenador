import { computed } from 'vue';
import { formatLocalDate } from '../../../shared/utils/localDate.js';

/** Agrupa y resume sesiones para Mi Progreso (cliente) y panel de gráficas. */

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function sessionDate(session) {
  const raw = session?.finished_at || session?.created_at || session?.started_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfLocalWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = domingo
  const offset = day === 0 ? -6 : 1 - day; // lunes
  d.setDate(d.getDate() + offset);
  return d;
}

function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function monthKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabelFromKey(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/**
 * Agrupa y resume sesiones de entrenamiento para Mi Progreso (Feature 038 UX).
 * @param {import('vue').Ref|import('vue').ComputedRef|Array} sessionsSource
 */
export function useProgressSessions(sessionsSource) {
  const list = computed(() => {
    const raw = Array.isArray(sessionsSource)
      ? sessionsSource
      : (sessionsSource?.value ?? []);
    return Array.isArray(raw) ? raw : [];
  });

  const sortedSessions = computed(() => (
    [...list.value].sort((a, b) => {
      const da = sessionDate(a)?.getTime() || 0;
      const db = sessionDate(b)?.getTime() || 0;
      return db - da;
    })
  ));

  const completedSessions = computed(() => (
    sortedSessions.value.filter((s) => s.status === 'completed')
  ));

  const totalSessions = computed(() => list.value.length);
  const completedCount = computed(() => completedSessions.value.length);

  /** Días locales con ≥1 sesión completada (Set de YYYY-MM-DD). */
  const completedDaySet = computed(() => {
    const set = new Set();
    for (const session of completedSessions.value) {
      const d = sessionDate(session);
      if (d) set.add(formatLocalDate(d));
    }
    return set;
  });

  /**
   * Racha: días consecutivos con entrenamiento completado
   * hacia atrás desde hoy (o desde ayer si hoy aún no entrenó).
   */
  const currentStreak = computed(() => {
    const days = completedDaySet.value;
    if (days.size === 0) return 0;

    let cursor = new Date();
    const todayKey = formatLocalDate(cursor);
    if (!days.has(todayKey)) {
      cursor = addDays(cursor, -1);
    }

    let streak = 0;
    while (days.has(formatLocalDate(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  });

  /** Sesiones completadas en los últimos 7 días civiles. */
  const sessionsLast7Days = computed(() => {
    const start = addDays(new Date(), -6);
    start.setHours(0, 0, 0, 0);
    const startTs = start.getTime();
    return completedSessions.value.filter((s) => {
      const d = sessionDate(s);
      return d && d.getTime() >= startTs;
    }).length;
  });

  /**
   * Últimas N semanas (lunes–domingo): barras de actividad.
   * @returns {{ key: string, label: string, count: number, intensity: number }[]}
   */
  const weeklyActivity = computed(() => {
    const weeks = 12;
    const today = new Date();
    const thisWeekStart = startOfLocalWeek(today);
    const counts = new Map();

    for (const session of completedSessions.value) {
      const d = sessionDate(session);
      if (!d) continue;
      const weekStart = startOfLocalWeek(d);
      const key = formatLocalDate(weekStart);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const result = [];
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const weekStart = addDays(thisWeekStart, -7 * i);
      const key = formatLocalDate(weekStart);
      const count = counts.get(key) || 0;
      const label = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      result.push({ key, label, count, intensity: Math.min(1, count / 4) });
    }
    return result;
  });

  /** Actividad mensual (últimos 8 meses) para la pestaña Gráficas. */
  const monthlyActivity = computed(() => {
    const months = 8;
    const now = new Date();
    const counts = new Map();

    for (const session of completedSessions.value) {
      const d = sessionDate(session);
      if (!d) continue;
      const key = monthKeyFromDate(d);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const result = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKeyFromDate(d);
      const count = counts.get(key) || 0;
      result.push({
        key,
        label: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
        count,
      });
    }
    return result;
  });

  const recentSessions = computed(() => sortedSessions.value.slice(0, 5));

  /**
   * Resto del historial (después de las 5 recientes), agrupado por mes.
   * [{ key, label, count, sessions }]
   */
  const sessionsByMonth = computed(() => {
    const rest = sortedSessions.value.slice(5);
    const map = new Map();

    for (const session of rest) {
      const d = sessionDate(session);
      if (!d) continue;
      const key = monthKeyFromDate(d);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: monthLabelFromKey(key),
          sessions: [],
        });
      }
      map.get(key).sessions.push(session);
    }

    return [...map.values()]
      .map((group) => ({
        ...group,
        count: group.sessions.length,
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  });

  /** Todos los meses (para gráficas / panorama completo). */
  const allSessionsByMonth = computed(() => {
    const map = new Map();
    for (const session of sortedSessions.value) {
      const d = sessionDate(session);
      if (!d) continue;
      const key = monthKeyFromDate(d);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: monthLabelFromKey(key),
          sessions: [],
        });
      }
      map.get(key).sessions.push(session);
    }
    return [...map.values()]
      .map((group) => ({ ...group, count: group.sessions.length }))
      .sort((a, b) => b.key.localeCompare(a.key));
  });

  return {
    sortedSessions,
    completedSessions,
    totalSessions,
    completedCount,
    currentStreak,
    sessionsLast7Days,
    weeklyActivity,
    monthlyActivity,
    recentSessions,
    sessionsByMonth,
    allSessionsByMonth,
  };
}
