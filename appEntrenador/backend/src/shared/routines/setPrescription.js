/**
 * Feature 085 — Per-set weight/reps prescription helpers (backend).
 * Shape: [{ set: 1, reps: 12, weight: 40 }, ...]
 */

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Parse JSON column / API value into array or null.
 * @param {unknown} raw
 * @returns {Array<{ set: number, reps: number, weight: number }>|null}
 */
function parseSetPrescription(raw) {
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
  return value;
}

/**
 * Normalize optional set_prescription from payload.
 * If absent/null/empty → null (legacy uniform mode).
 * If present → must match `series` length; syncs series from length.
 * Summary reps/weight for columns = set 1.
 *
 * @param {object} item - raw exercise item
 * @param {string} nombre
 * @param {number} series
 * @param {number} repeticiones
 * @param {number} peso
 * @returns {{ set_prescription: Array|{null}, series: number, repeticiones: number, peso: number }}
 */
function normalizeSetPrescription(item, nombre, series, repeticiones, peso) {
  const raw = item?.set_prescription;
  if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
    return {
      set_prescription: null,
      series,
      repeticiones,
      peso,
    };
  }

  if (!Array.isArray(raw)) {
    throw createHttpError(
      `Prescripción por serie inválida en "${nombre}".`,
      400,
    );
  }

  if (raw.length < 1 || raw.length > 30) {
    throw createHttpError(
      `Prescripción por serie en "${nombre}" debe tener entre 1 y 30 series.`,
      400,
    );
  }

  const normalized = raw.map((row, index) => {
    const setNum = Number(row?.set ?? index + 1);
    const reps = Number(row?.reps ?? row?.repeticiones);
    const weight = Number(row?.weight ?? row?.peso);

    if (!Number.isInteger(setNum) || setNum !== index + 1) {
      throw createHttpError(
        `Series deben ser consecutivas desde 1 en "${nombre}".`,
        400,
      );
    }
    if (!Number.isInteger(reps) || reps < 1) {
      throw createHttpError(
        `Reps inválidas en serie ${index + 1} de "${nombre}".`,
        400,
      );
    }
    if (Number.isNaN(weight) || weight < 0) {
      throw createHttpError(
        `Peso inválido en serie ${index + 1} de "${nombre}".`,
        400,
      );
    }

    return {
      set: setNum,
      reps,
      weight,
    };
  });

  // If caller also sent series, it must match (or we take prescription length).
  if (Number.isInteger(series) && series !== normalized.length) {
    // Prefer prescription length as source of truth when provided.
  }

  return {
    set_prescription: normalized,
    series: normalized.length,
    repeticiones: normalized[0].reps,
    peso: normalized[0].weight,
  };
}

/**
 * Serialize for MySQL JSON column (null or stringified array).
 * @param {Array|null} prescription
 * @returns {string|null}
 */
function serializeSetPrescription(prescription) {
  if (!prescription || !Array.isArray(prescription) || prescription.length === 0) {
    return null;
  }
  return JSON.stringify(prescription);
}

/**
 * Map DB value to API array or null.
 * @param {unknown} raw
 */
function mapSetPrescriptionFromDb(raw) {
  const parsed = parseSetPrescription(raw);
  if (!parsed) return null;
  return parsed.map((row, index) => ({
    set: Number(row.set) || index + 1,
    reps: Number(row.reps) || Number(row.repeticiones) || 1,
    weight: Number(row.weight ?? row.peso) || 0,
  }));
}

module.exports = {
  parseSetPrescription,
  normalizeSetPrescription,
  serializeSetPrescription,
  mapSetPrescriptionFromDb,
};
