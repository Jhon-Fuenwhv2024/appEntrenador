/**
 * Text scale preference for low-vision / large phone font.
 *
 * Many mobile browsers / PWAs do NOT pass OS font size into the page root,
 * so rem alone is unreliable. We apply `--tf-font-scale` via CSS `zoom` on
 * `html` (scales rem + px + layout). Pinch-zoom stays available via viewport.
 *
 * localStorage key is device-local (no account sync).
 */

export const TEXT_SCALE_STORAGE_KEY = 'tf_text_scale';

/** @typedef {'default' | 'large' | 'xlarge'} TextScaleId */

/** @type {Record<TextScaleId, { value: number, label: string, sample: string }>} */
export const TEXT_SCALE_PRESETS = {
  default: { value: 1, label: 'Normal', sample: 'Aa' },
  large: { value: 1.2, label: 'Grande', sample: 'Aa' },
  xlarge: { value: 1.35, label: 'Muy grande', sample: 'Aa' },
};

/**
 * @param {string | null | undefined} id
 * @returns {TextScaleId}
 */
export function normalizeTextScaleId(id) {
  if (id && Object.prototype.hasOwnProperty.call(TEXT_SCALE_PRESETS, id)) {
    return /** @type {TextScaleId} */ (id);
  }
  return 'default';
}

/**
 * @returns {TextScaleId}
 */
export function getStoredTextScaleId() {
  try {
    return normalizeTextScaleId(localStorage.getItem(TEXT_SCALE_STORAGE_KEY));
  } catch {
    return 'default';
  }
}

/**
 * Apply scale to document (safe to call before Vue mounts).
 * @param {TextScaleId | string} id
 */
export function applyTextScale(id) {
  const key = normalizeTextScaleId(id);
  const { value } = TEXT_SCALE_PRESETS[key];
  const root = document.documentElement;
  root.style.setProperty('--tf-font-scale', String(value));
  root.dataset.textScale = key;
}

/**
 * Persist + apply.
 * @param {TextScaleId | string} id
 * @returns {TextScaleId}
 */
export function setTextScale(id) {
  const key = normalizeTextScaleId(id);
  try {
    localStorage.setItem(TEXT_SCALE_STORAGE_KEY, key);
  } catch (error) {
    console.warn('[textScale] could not persist preference:', error);
  }
  applyTextScale(key);
  return key;
}

/** Bootstrap from storage (call once from main.js). */
export function initTextScale() {
  applyTextScale(getStoredTextScaleId());
}
