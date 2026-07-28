import { computed, shallowRef } from 'vue';

/** Rangos permitidos en tendencias de Mi progreso (Feature 072). */
export const PROGRESS_RANGE_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
];

/**
 * Semanas de actividad visual acopladas al rango de tendencias.
 * 7 → 2, 30 → 4, 90 → 12.
 */
export function weeksForRange(rangeDays) {
  if (rangeDays === 7) return 2;
  if (rangeDays === 30) return 4;
  return 12;
}

/**
 * Fecha de corte local (inicio del día) para `rangeDays` civiles inclusive.
 * @param {number|null|undefined} rangeDays
 * @returns {Date|null}
 */
export function rangeCutoffDate(rangeDays) {
  if (rangeDays == null || rangeDays <= 0) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (rangeDays - 1));
  return start;
}

/**
 * Filtra series alineadas por índice según labels de fecha ISO / parseable.
 * @param {string[]} labels
 * @param {Array<Array<number|null>>} seriesList
 * @param {number|null|undefined} rangeDays
 */
export function filterAlignedSeriesByRange(labels, seriesList, rangeDays) {
  const cutoff = rangeCutoffDate(rangeDays);
  if (!cutoff || !Array.isArray(labels) || labels.length === 0) {
    return {
      labels: labels ?? [],
      seriesList: (seriesList ?? []).map((s) => (Array.isArray(s) ? s : [])),
    };
  }

  const cutoffTs = cutoff.getTime();
  const indices = [];
  for (let i = 0; i < labels.length; i += 1) {
    const d = new Date(labels[i]);
    if (!Number.isNaN(d.getTime()) && d.getTime() >= cutoffTs) {
      indices.push(i);
    }
  }

  return {
    labels: indices.map((i) => labels[i]),
    seriesList: (seriesList ?? []).map((series) => (
      indices.map((i) => (Array.isArray(series) ? series[i] : null))
    )),
  };
}

/**
 * Tendencia textual a partir de valores numéricos (primer → último punto válido).
 * @param {Array<number|null|undefined>} values
 * @param {number} [epsilon=0.05]
 * @returns {{ direction: 'up'|'down'|'stable', label: string, delta: number }|null}
 */
export function computeSeriesTrend(values, epsilon = 0.05) {
  const nums = (values ?? [])
    .map((v) => (v == null || v === '' ? null : Number(v)))
    .filter((v) => v != null && !Number.isNaN(v));
  if (nums.length < 2) return null;

  const delta = nums[nums.length - 1] - nums[0];
  if (Math.abs(delta) < epsilon) {
    return { direction: 'stable', label: 'Estable', delta };
  }
  if (delta > 0) {
    return { direction: 'up', label: 'Sube', delta };
  }
  return { direction: 'down', label: 'Baja', delta };
}

/**
 * Delta de peso hero: último log vs el inmediato anterior (ordenado por measured_at).
 * @param {Array<{ measured_at?: string, weight_kg?: number|string }>} logs
 * @returns {{ deltaKg: number, lastKg: number, prevKg: number }|null}
 */
export function computeWeightDelta(logs) {
  if (!Array.isArray(logs) || logs.length < 2) return null;

  const sorted = [...logs]
    .filter((l) => l && l.weight_kg != null && !Number.isNaN(Number(l.weight_kg)))
    .sort((a, b) => {
      const da = new Date(a.measured_at).getTime() || 0;
      const db = new Date(b.measured_at).getTime() || 0;
      return da - db;
    });

  if (sorted.length < 2) return null;

  const prev = sorted[sorted.length - 2];
  const last = sorted[sorted.length - 1];
  const prevKg = Number(prev.weight_kg);
  const lastKg = Number(last.weight_kg);
  if (Number.isNaN(prevKg) || Number.isNaN(lastKg)) return null;

  return {
    deltaKg: Math.round((lastKg - prevKg) * 10) / 10,
    lastKg,
    prevKg,
  };
}

/**
 * Estado de rango 7/30/90 para tendencias.
 * @param {number} [initial=30]
 */
export function useProgressRange(initial = 30) {
  const rangeDays = shallowRef(initial);

  const weekCount = computed(() => weeksForRange(rangeDays.value));

  function setRangeDays(days) {
    if (days === 7 || days === 30 || days === 90) {
      rangeDays.value = days;
    }
  }

  return {
    rangeDays,
    weekCount,
    setRangeDays,
    options: PROGRESS_RANGE_OPTIONS,
  };
}
