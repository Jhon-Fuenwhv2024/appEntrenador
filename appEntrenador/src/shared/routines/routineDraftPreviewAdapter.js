/**
 * Feature 084 — Map trainer routine draft + catalog → client-style preview exercises.
 */

/**
 * @param {object|null|undefined} catalogItem
 * @returns {{ media_type: string, media_url: string|null, local_media_path: string|null, name_es: string|null, description_es: string|null }}
 */
function mediaFromCatalog(catalogItem) {
  if (!catalogItem) {
    return {
      media_type: 'none',
      media_url: null,
      local_media_path: null,
      name_es: null,
      description_es: null,
    };
  }
  return {
    media_type: catalogItem.media_type || 'none',
    media_url: catalogItem.media_url ?? null,
    local_media_path: catalogItem.local_media_path ?? null,
    name_es: catalogItem.name_es ?? null,
    description_es: catalogItem.description_es ?? null,
  };
}

/**
 * Build lookup maps from catalog list.
 * @param {Array<object>} catalogExercises
 * @returns {{ byId: Map<number, object>, byName: Map<string, object> }}
 */
export function buildCatalogLookups(catalogExercises) {
  const byId = new Map();
  const byName = new Map();
  const list = Array.isArray(catalogExercises) ? catalogExercises : [];

  for (const item of list) {
    const id = Number(item?.id);
    if (Number.isFinite(id) && id > 0) {
      byId.set(id, item);
    }
    const en = String(item?.name || '').trim().toLowerCase();
    const es = String(item?.name_es || '').trim().toLowerCase();
    const display = String(item?.display_name || '').trim().toLowerCase();
    if (en) byName.set(en, item);
    if (es) byName.set(es, item);
    if (display) byName.set(display, item);
  }

  return { byId, byName };
}

/**
 * Resolve catalog match for a draft exercise row.
 * @param {object} ex
 * @param {{ byId: Map<number, object>, byName: Map<string, object> }} lookups
 * @returns {object|null}
 */
export function resolveCatalogMatch(ex, lookups) {
  const id = Number(ex?.exercise_id);
  if (Number.isFinite(id) && id > 0 && lookups.byId.has(id)) {
    return lookups.byId.get(id);
  }
  const name = String(ex?.nombre || '').trim().toLowerCase();
  if (name && lookups.byName.has(name)) {
    return lookups.byName.get(name);
  }
  return null;
}

/**
 * Enrich a single draft exercise for preview / row thumb.
 * @param {object} ex
 * @param {number} index
 * @param {{ byId: Map<number, object>, byName: Map<string, object> }} lookups
 */
export function enrichDraftExercise(ex, index, lookups) {
  const match = resolveCatalogMatch(ex, lookups);
  const media = mediaFromCatalog(match);
  const nombre = String(ex?.nombre || '').trim();

  return {
    id: ex?.id ?? `draft-${index}`,
    nombre: nombre || 'Ejercicio sin nombre',
    name_es: media.name_es,
    description_es: media.description_es,
    series: Number(ex?.series) || 0,
    repeticiones: Number(ex?.repeticiones) || 0,
    peso: ex?.peso ?? 0,
    set_prescription: ex?.set_prescription ?? null,
    customize_sets: Boolean(ex?.customize_sets),
    rest_time_seconds: Number(ex?.rest_time_seconds) || 0,
    superset_letter: ex?.superset_letter ?? null,
    indicaciones: typeof ex?.indicaciones === 'string' ? ex.indicaciones : '',
    exercise_id: ex?.exercise_id ?? match?.id ?? null,
    media_type: media.media_type,
    media_url: media.media_url,
    local_media_path: media.local_media_path,
    has_media: Boolean(
      (media.local_media_path && String(media.local_media_path).trim())
      || (media.media_url && String(media.media_url).trim() && media.media_type !== 'none'),
    ),
  };
}

/**
 * @param {{ dia_semana?: string, nombre_rutina?: string, ejercicios?: Array<object> }} form
 * @param {Array<object>} catalogExercises
 * @returns {{ dia_semana: string, nombre_rutina: string, ejercicios: Array<object> }}
 */
export function adaptRoutineDraftToPreview(form, catalogExercises) {
  const lookups = buildCatalogLookups(catalogExercises);
  const rows = Array.isArray(form?.ejercicios) ? form.ejercicios : [];

  return {
    dia_semana: form?.dia_semana || '',
    nombre_rutina: String(form?.nombre_rutina || '').trim() || 'Sin nombre',
    ejercicios: rows.map((ex, index) => enrichDraftExercise(ex, index, lookups)),
  };
}
