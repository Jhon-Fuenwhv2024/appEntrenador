<script setup>
defineProps({
  muscleOptions: {
    type: Array,
    required: true,
  },
  secondaryOptions: {
    type: Array,
    required: true,
  },
  selectedPrimary: {
    type: String,
    default: null,
  },
  selectedSecondary: {
    type: Array,
    default: () => [],
  },
  isWarmup: {
    default: null,
    validator: (value) => value === null || typeof value === 'boolean',
  },
  canSave: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'select-primary',
  'update:selectedSecondary',
  'update:isWarmup',
  'save',
]);
</script>

<template>
  <div class="tagger-controls">
    <section class="tagger-controls__section">
      <h2 class="tagger-controls__label">
        Músculo principal
        <span class="tagger-controls__required">*</span>
      </h2>
      <div class="tagger-controls__primary">
        <v-btn
          v-for="muscle in muscleOptions"
          :key="muscle"
          class="tagger-controls__primary-btn"
          :variant="selectedPrimary === muscle ? 'flat' : 'outlined'"
          :color="selectedPrimary === muscle ? 'primary' : undefined"
          size="small"
          density="comfortable"
          @click="emit('select-primary', muscle)"
        >
          {{ muscle }}
        </v-btn>
      </div>
    </section>

    <section class="tagger-controls__section">
      <h2 class="tagger-controls__label">
        Músculos secundarios
        <span class="tagger-controls__optional">(opcional)</span>
      </h2>
      <v-chip-group
        class="tagger-controls__chips"
        :model-value="selectedSecondary"
        multiple
        selected-class="text-primary"
        @update:model-value="emit('update:selectedSecondary', $event)"
      >
        <v-chip
          v-for="muscle in secondaryOptions"
          :key="muscle"
          :value="muscle"
          filter
          size="small"
          variant="outlined"
        >
          {{ muscle }}
        </v-chip>
      </v-chip-group>
    </section>

    <section
      class="tagger-controls__section"
      :class="{ 'tagger-controls__section--disabled': !selectedPrimary }"
    >
      <h2 class="tagger-controls__label">
        ¿Sirve de calentamiento?
        <span class="tagger-controls__required">*</span>
      </h2>
      <p class="tagger-controls__hint">
        <template v-if="selectedPrimary">
          Indica si este ejercicio se puede usar como calentamiento
          para <strong>{{ selectedPrimary }}</strong>
          (y músculos relacionados).
        </template>
        <template v-else>
          Primero elige el músculo principal.
        </template>
      </p>
      <div class="tagger-controls__warmup">
        <v-btn
          class="tagger-controls__warmup-btn"
          :variant="isWarmup === true ? 'flat' : 'outlined'"
          :color="isWarmup === true ? 'primary' : undefined"
          :disabled="!selectedPrimary"
          size="small"
          @click="emit('update:isWarmup', true)"
        >
          Sí, calentamiento
        </v-btn>
        <v-btn
          class="tagger-controls__warmup-btn"
          :variant="isWarmup === false ? 'flat' : 'outlined'"
          :color="isWarmup === false ? 'primary' : undefined"
          :disabled="!selectedPrimary"
          size="small"
          @click="emit('update:isWarmup', false)"
        >
          No
        </v-btn>
      </div>
    </section>

    <div class="tagger-controls__save-wrap">
      <v-btn
        class="tagger-controls__save"
        color="primary"
        size="large"
        block
        :disabled="!canSave"
        :loading="saving"
        @click="emit('save')"
      >
        Guardar y siguiente
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.tagger-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.tagger-controls__section {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.tagger-controls__section--disabled {
  opacity: 0.55;
}

.tagger-controls__label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.88);
  text-align: left;
}

.tagger-controls__required {
  color: rgb(var(--v-theme-error));
}

.tagger-controls__optional {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8rem;
}

.tagger-controls__hint {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.5);
  text-align: left;
}

.tagger-controls__hint strong {
  color: rgba(0, 229, 255, 0.9);
  font-weight: 600;
}

.tagger-controls__primary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-start;
}

.tagger-controls__primary-btn,
.tagger-controls__warmup-btn {
  text-transform: none;
  letter-spacing: 0;
}

.tagger-controls__chips {
  justify-content: flex-start;
}

.tagger-controls__warmup {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tagger-controls__save-wrap {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
  background: linear-gradient(
    180deg,
    rgba(11, 13, 18, 0) 0%,
    rgba(11, 13, 18, 0.92) 28%,
    #0b0d12 100%
  );
}

.tagger-controls__save {
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  min-height: 48px;
}
</style>
