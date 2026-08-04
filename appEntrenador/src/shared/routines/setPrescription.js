/**
 * Feature 085 — Per-set prescription helpers (frontend).
 * Shape: [{ set: 1, reps: 12, weight: 40 }, ...]
 */

/**
 * @param {unknown} raw
 * @returns {Array<{ set: number, reps: number, weight: number }>|null}
 */
export function parseSetPrescription(raw) {
  if (raw == null || raw === '') return null;
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.map((row, index) => ({
    set: Number(row?.set) || index + 1,
    reps: Number(row?.reps ?? row?.repeticiones) || 1,
    weight: Number(row?.weight ?? row?.peso) || 0,
  }));
}

/**
 * True when prescription has varying reps or weight across sets.
 * @param {Array|{null|undefined}} prescription
 * @param {{ repeticiones?: number, peso?: number }} [fallback]
 */
export function isVariableSetPrescription(prescription, fallback = {}) {
  const list = parseSetPrescription(prescription);
  if (!list || list.length < 2) return false;
  const firstReps = list[0].reps;
  const firstWeight = list[0].weight;
  return list.some((row) => row.reps !== firstReps || row.weight !== firstWeight)
    || (
      fallback.repeticiones != null
      && Number(fallback.repeticiones) !== firstReps
    )
    || (
      fallback.peso != null
      && Number(fallback.peso) !== firstWeight
    );
}

/**
 * Build uniform prescription from series count + single reps/weight.
 * @param {number} series
 * @param {number} reps
 * @param {number} weight
 */
export function buildUniformSetPrescription(series, reps, weight) {
  const n = Math.max(1, Math.round(Number(series)) || 1);
  const r = Math.max(1, Math.round(Number(reps)) || 1);
  const w = Number(weight);
  const safeW = Number.isFinite(w) && w >= 0 ? w : 0;
  return Array.from({ length: n }, (_, i) => ({
    set: i + 1,
    reps: r,
    weight: safeW,
  }));
}

/**
 * Resize prescription when series count changes (copy last row for new sets).
 * @param {Array|{null}} current
 * @param {number} series
 * @param {number} fallbackReps
 * @param {number} fallbackWeight
 */
export function resizeSetPrescription(current, series, fallbackReps, fallbackWeight) {
  const n = Math.max(1, Math.round(Number(series)) || 1);
  const existing = parseSetPrescription(current) || [];
  const next = [];
  for (let i = 0; i < n; i += 1) {
    const prev = existing[i] || existing[existing.length - 1];
    next.push({
      set: i + 1,
      reps: prev
        ? Math.max(1, Math.round(Number(prev.reps)) || 1)
        : Math.max(1, Math.round(Number(fallbackReps)) || 1),
      weight: prev
        ? (Number.isFinite(Number(prev.weight)) ? Number(prev.weight) : 0)
        : (Number.isFinite(Number(fallbackWeight)) ? Number(fallbackWeight) : 0),
    });
  }
  return next;
}

/**
 * Prefill metrics for a given 1-based set number.
 * @param {{ set_prescription?: unknown, peso?: number, repeticiones?: number }} ex
 * @param {number} setNumber
 * @returns {{ weight: number, reps: number }}
 */
export function resolveSetPrefill(ex, setNumber) {
  const list = parseSetPrescription(ex?.set_prescription);
  const idx = Math.max(1, Math.round(Number(setNumber)) || 1) - 1;
  if (list && list[idx]) {
    return {
      weight: Number(list[idx].weight) || 0,
      reps: Math.max(1, Number(list[idx].reps) || 1),
    };
  }
  return {
    weight: Number(ex?.peso) || 0,
    reps: Math.max(1, Number(ex?.repeticiones) || 1),
  };
}

/**
 * Human label for cards / preview.
 * @param {{ set_prescription?: unknown, series?: number, repeticiones?: number, peso?: number }} ex
 */
export function prescriptionLabel(ex) {
  const list = parseSetPrescription(ex?.set_prescription);
  if (list && list.length > 0) {
    const variable = list.some(
      (row) => row.reps !== list[0].reps || row.weight !== list[0].weight,
    );
    if (variable) {
      return list
        .map((row) => {
          const w = Number(row.weight) || 0;
          return w > 0 ? `${row.reps}×${w}` : `${row.reps} reps`;
        })
        .join(' · ');
    }
  }

  const series = Number(ex?.series) || (list ? list.length : 0);
  const reps = Number(ex?.repeticiones) || (list?.[0]?.reps) || 0;
  const peso = Number(ex?.peso);
  const parts = [];
  if (series) parts.push(`${series} series`);
  if (reps) parts.push(`${reps} reps`);
  if (Number.isFinite(peso) && String(ex?.peso ?? '').trim() !== '' && peso !== 0) {
    parts.push(`${peso} kg`);
  }
  return parts.join(' · ') || 'Sin prescripción';
}

/**
 * Payload field: send null when uniform (all sets same as top-level reps/weight).
 * Send array when customized / variable OR always when customized flag true.
 * @param {object} ex
 * @param {boolean} customized
 */
export function setPrescriptionForPayload(ex, customized) {
  if (!customized) return null;
  const series = Math.max(1, Math.round(Number(ex.series)) || 1);
  const list = parseSetPrescription(ex.set_prescription)
    || buildUniformSetPrescription(series, ex.repeticiones, ex.peso);
  const resized = resizeSetPrescription(list, series, ex.repeticiones, ex.peso);
  return resized;
}
