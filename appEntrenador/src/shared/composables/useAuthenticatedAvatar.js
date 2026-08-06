import { computed, shallowRef, toValue, watch } from 'vue';
import defaultAvatar from '../../assets/foto_perfil.png';
import {
  fetchAuthenticatedMediaBlobUrl,
  isCustomFotoUrl,
} from '../utils/authenticatedMedia.js';

/**
 * Load profile photos via Bearer fetch → blob URL (img cannot send Authorization).
 * Avoids baking the short-lived access JWT into ?token= on <img src>.
 *
 * @param {import('vue').MaybeRefOrGetter<string|null|undefined>} fotoUrlSource
 * @param {{
 *   fallback?: 'initials' | 'default',
 *   reloadToken?: import('vue').MaybeRefOrGetter<number|string>,
 * }} [options]
 *   - `initials`: hide img until blob is ready; on miss/error show slot/initials
 *   - `default`: always expose an img src (default asset while loading / on error)
 *   - `reloadToken`: bump to force reload when `fotoUrl` string is unchanged (re-upload)
 */
export function useAuthenticatedAvatar(fotoUrlSource, options = {}) {
  const fallback = options.fallback === 'initials' ? 'initials' : 'default';

  const displaySrc = shallowRef(defaultAvatar);
  const ready = shallowRef(false);
  const failed = shallowRef(false);
  const isLoading = shallowRef(false);
  let requestId = 0;

  const rawFoto = computed(() => {
    const value = toValue(fotoUrlSource);
    return typeof value === 'string' ? value.trim() : '';
  });

  const hasCustomFoto = computed(() => isCustomFotoUrl(rawFoto.value));

  /** Whether the template should render an <img> (vs initials fallback). */
  const showPhoto = computed(() => {
    if (fallback === 'initials') {
      return ready.value && !failed.value;
    }
    return true;
  });

  watch(
    () => [rawFoto.value, toValue(options.reloadToken) ?? 0],
    async ([url]) => {
      const id = ++requestId;
      failed.value = false;

      if (!isCustomFotoUrl(url)) {
        ready.value = false;
        isLoading.value = false;
        displaySrc.value = defaultAvatar;
        return;
      }

      // Local preview from file picker — no auth fetch.
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        ready.value = true;
        isLoading.value = false;
        displaySrc.value = url;
        return;
      }

      if (fallback === 'default') {
        displaySrc.value = defaultAvatar;
      }
      ready.value = false;
      isLoading.value = true;

      try {
        const blobUrl = await fetchAuthenticatedMediaBlobUrl(url);
        if (id !== requestId) return;
        if (!blobUrl) {
          failed.value = true;
          ready.value = false;
          displaySrc.value = defaultAvatar;
          return;
        }
        displaySrc.value = blobUrl;
        ready.value = true;
        failed.value = false;
      } catch (error) {
        console.error('[avatar] authenticated load failed:', error);
        if (id !== requestId) return;
        failed.value = true;
        ready.value = false;
        displaySrc.value = defaultAvatar;
      } finally {
        if (id === requestId) {
          isLoading.value = false;
        }
      }
    },
    { immediate: true },
  );

  function onImgError() {
    failed.value = true;
    ready.value = false;
    displaySrc.value = defaultAvatar;
  }

  return {
    displaySrc,
    showPhoto,
    hasCustomFoto,
    isLoading,
    onImgError,
  };
}
