<script setup>
/**
 * Feature 059 — Checklist of sets for the current exercise (Set | Anterior | kg×reps).
 */
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  weight: {
    type: [Number, String],
    default: 0,
  },
  reps: {
    type: [Number, String],
    default: 0,
  },
  formError: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:weight', 'update:reps']);
</script>

<template>
  <div class="sets-check" role="table" aria-label="Series del ejercicio">
    <div class="sets-check__head" role="row">
      <span class="sets-check__col sets-check__col--set" role="columnheader">Set</span>
      <span class="sets-check__col sets-check__col--prev" role="columnheader">Anterior</span>
      <span class="sets-check__col sets-check__col--vals" role="columnheader">kg × reps</span>
      <span class="sets-check__col sets-check__col--mark" role="columnheader">
        <span class="visually-hidden">Estado</span>
      </span>
    </div>

    <div
      v-for="row in rows"
      :key="row.setNumber"
      class="sets-check__row"
      :class="{
        'sets-check__row--done': row.status === 'done',
        'sets-check__row--current': row.status === 'current',
      }"
      role="row"
    >
      <span class="sets-check__col sets-check__col--set" role="cell">
        {{ row.setNumber }}
      </span>
      <span class="sets-check__col sets-check__col--prev" role="cell">
        {{ row.previousLabel }}
      </span>
      <span class="sets-check__col sets-check__col--vals" role="cell">
        <template v-if="row.status === 'done'">
          <span class="sets-check__done-vals">{{ row.weight }} × {{ row.reps }}</span>
        </template>
        <template v-else-if="row.status === 'current'">
          <div class="sets-check__inputs" role="group" :aria-label="`Serie ${row.setNumber}`">
            <input
              class="sets-check__input"
              type="number"
              min="0"
              step="0.5"
              inputmode="decimal"
              :value="weight"
              aria-label="Peso en kilogramos"
              @input="emit('update:weight', Number($event.target.value))"
            >
            <span class="sets-check__x" aria-hidden="true">×</span>
            <input
              class="sets-check__input"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              :value="reps"
              aria-label="Repeticiones"
              @input="emit('update:reps', Number($event.target.value))"
            >
          </div>
        </template>
        <template v-else>
          <span class="sets-check__placeholder">—</span>
        </template>
      </span>
      <span class="sets-check__col sets-check__col--mark" role="cell">
        <span
          v-if="row.status === 'done'"
          class="sets-check__check"
          aria-label="Completada"
        >
          <v-icon icon="mdi-check" size="16" />
        </span>
        <span
          v-else-if="row.status === 'current'"
          class="sets-check__dot"
          aria-label="En curso"
        />
        <span v-else class="sets-check__empty" aria-hidden="true" />
      </span>
    </div>

    <p v-if="formError" class="sets-check__error">{{ formError }}</p>
  </div>
</template>

<style scoped>
.sets-check {
  width: 100%;
  margin: 0 0 8px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.sets-check__head,
.sets-check__row {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) minmax(0, 1.35fr) 2rem;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
}

.sets-check__head {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 10px;
  padding-bottom: 8px;
}

.sets-check__head .sets-check__col {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.sets-check__row {
  min-height: 44px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.sets-check__row--done {
  background: rgba(47, 191, 113, 0.12);
}

.sets-check__row--current {
  background: rgba(0, 229, 255, 0.08);
}

.sets-check__col--set {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 0.9rem;
  color: #C5CAD3;
  text-align: center;
}

.sets-check__row--current .sets-check__col--set {
  color: #00E5FF;
}

.sets-check__col--prev {
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sets-check__done-vals {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 0.9rem;
  color: #2FBF71;
}

.sets-check__placeholder {
  color: #5E6673;
  font-size: 0.9rem;
}

.sets-check__inputs {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.sets-check__input {
  flex: 1;
  min-width: 0;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(15, 18, 24, 0.85);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
  appearance: textfield;
  -moz-appearance: textfield;
}

.sets-check__input:focus:not(:focus-visible) {
  outline: none;
}

.sets-check__input:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: 1px;
}

.sets-check__input::-webkit-outer-spin-button,
.sets-check__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.sets-check__input:focus {
  border-color: rgba(0, 229, 255, 0.55);
}

.sets-check__x {
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-weight: 600;
  flex-shrink: 0;
}

.sets-check__check {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #2FBF71;
  color: #0B0D12;
  margin-inline: auto;
}

.sets-check__dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00E5FF;
  margin-inline: auto;
  box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.2);
}

.sets-check__empty {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  margin-inline: auto;
}

.sets-check__error {
  margin: 0;
  padding: 8px 10px 10px;
  color: #ff8a80;
  font-size: 0.85rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
