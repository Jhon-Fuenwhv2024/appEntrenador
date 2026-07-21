<script setup>
/**
 * Exercise coach notes — clamped to 3 lines with Ver más / Ver menos.
 */
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
});

const expanded = shallowRef(false);
const needsToggle = shallowRef(false);
const bodyEl = ref(null);

const trimmed = computed(() => props.text?.trim() || '');

async function measureOverflow() {
  await nextTick();
  const el = bodyEl.value;
  if (!el || expanded.value) return;
  needsToggle.value = el.scrollHeight > el.clientHeight + 1;
}

watch(trimmed, () => {
  expanded.value = false;
  measureOverflow();
});

onMounted(() => {
  measureOverflow();
});

function toggle() {
  expanded.value = !expanded.value;
  if (!expanded.value) {
    measureOverflow();
  }
}
</script>

<template>
  <div v-if="trimmed" class="hint-expand">
    <p
      ref="bodyEl"
      class="hint-expand__body"
      :class="{ 'hint-expand__body--clamped': !expanded }"
    >
      {{ trimmed }}
    </p>
    <button
      v-if="needsToggle || expanded"
      type="button"
      class="hint-expand__toggle"
      @click="toggle"
    >
      {{ expanded ? 'Ver menos' : 'Ver más' }}
    </button>
  </div>
</template>

<style scoped>
.hint-expand {
  margin: 0 0 12px;
  max-width: 100%;
}

.hint-expand__body {
  margin: 0;
  color: #8B929E;
  font-size: 0.9rem;
  line-height: 1.45;
}

.hint-expand__body--clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.hint-expand__toggle {
  margin-top: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #00E5FF;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
