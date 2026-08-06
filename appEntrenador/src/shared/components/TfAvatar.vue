<script setup>
/**
 * Profile avatar that loads private /uploads/avatars via Bearer → blob URL.
 */
import { useAuthenticatedAvatar } from '../composables/useAuthenticatedAvatar.js';

const props = defineProps({
  fotoUrl: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  /** `initials` = hide img until blob ready; `default` = always show img (asset fallback). */
  fallback: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'initials'].includes(value),
  },
  initials: {
    type: String,
    default: '?',
  },
  imgClass: {
    type: String,
    default: '',
  },
  initialsClass: {
    type: String,
    default: '',
  },
});

const { displaySrc, showPhoto, onImgError } = useAuthenticatedAvatar(
  () => props.fotoUrl,
  { fallback: props.fallback },
);
</script>

<template>
  <img
    v-if="showPhoto"
    :src="displaySrc"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    @error="onImgError"
  >
  <span
    v-else
    :class="initialsClass"
    aria-hidden="true"
  >{{ initials }}</span>
</template>
