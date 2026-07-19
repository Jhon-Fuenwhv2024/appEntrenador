<script setup>
/**
 * Filtro práctico por músculo: select + toggle calentamiento (una sola fila).
 */
import { computed } from 'vue';
import { MUSCLE_OPTIONS } from '../constants/muscles.js';

const props = defineProps({
  modelValue: {
    default: null,
    validator: (value) => value === null || typeof value === 'string',
  },
  showWarmup: {
    type: Boolean,
    default: false,
  },
  onlyWarmup: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'Músculo',
  },
});

const emit = defineEmits(['update:modelValue', 'update:onlyWarmup']);

const muscleItems = computed(() => [
  { title: 'Todos los músculos', value: '' },
  ...MUSCLE_OPTIONS.map((muscle) => ({ title: muscle, value: muscle })),
]);

const selectedMuscle = computed(() => props.modelValue || '');

function onMuscleChange(value) {
  emit('update:modelValue', value ? String(value) : null);
}

function onWarmupChange(value) {
  emit('update:onlyWarmup', Boolean(value));
}
</script>

<template>
  <div
    class="mf"
    role="group"
    :aria-label="label"
  >
    <v-select
      class="mf__select"
      :model-value="selectedMuscle"
      :items="muscleItems"
      item-title="title"
      item-value="value"
      :label="label"
      density="compact"
      variant="outlined"
      hide-details
      clearable
      color="primary"
      bg-color="surface"
      prepend-inner-icon="mdi-arm-flex"
      :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 320 }"
      :list-props="{ bgColor: 'surface', color: undefined }"
      @update:model-value="onMuscleChange"
    />

    <v-btn
      v-if="showWarmup"
      class="mf__warmup"
      size="small"
      :variant="onlyWarmup ? 'flat' : 'outlined'"
      :color="onlyWarmup ? 'warning' : undefined"
      prepend-icon="mdi-fire"
      @click="onWarmupChange(!onlyWarmup)"
    >
      Calent.
    </v-btn>
  </div>
</template>

<style scoped>
.mf {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.mf__select {
  flex: 1 1 auto;
  min-width: 0;
}

.mf__warmup {
  flex: 0 0 auto;
  align-self: center;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  min-width: 5.75rem;
}

@media (max-width: 600px) {
  .mf__warmup {
    min-width: 0;
    padding-inline: 0.65rem;
  }
}
</style>
