<template>
  <img
    :src="APP_LOGO"
    :alt="APP_NAME"
    class="app-logo"
    :class="`app-logo--${size}`"
  />
</template>

<script setup>
import { APP_LOGO, APP_NAME } from '../config/app.js';

defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
});
</script>

<style scoped>
.app-logo {
  display: block;
  object-fit: contain;
}

.app-logo--sm {
  width: 28px;
  height: 28px;
}

.app-logo--md {
  width: 40px;
  height: 40px;
}

.app-logo--lg {
  width: 56px;
  height: 56px;
}
</style>
