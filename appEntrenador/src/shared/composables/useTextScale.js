/**
 * Reactive wrapper around shared textScale preference.
 */
import { readonly, shallowRef } from 'vue';
import {
  TEXT_SCALE_PRESETS,
  applyTextScale,
  getStoredTextScaleId,
  normalizeTextScaleId,
  setTextScale as persistTextScale,
} from '../textScale.js';

const scaleId = shallowRef(getStoredTextScaleId());

export function useTextScale() {
  function setScale(id) {
    const next = persistTextScale(id);
    scaleId.value = next;
    return next;
  }

  function refreshFromStorage() {
    const id = getStoredTextScaleId();
    applyTextScale(id);
    scaleId.value = id;
    return id;
  }

  return {
    scaleId: readonly(scaleId),
    presets: TEXT_SCALE_PRESETS,
    setScale,
    refreshFromStorage,
    normalizeTextScaleId,
  };
}
