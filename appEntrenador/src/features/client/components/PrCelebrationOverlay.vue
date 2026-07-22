<script setup>
/**
 * Full-screen PR celebration after finishing a workout (Feature 041).
 */
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  prs: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const list = computed(() => (Array.isArray(props.prs) ? props.prs : []));

function close() {
  visible.value = false;
}
</script>

<template>
  <v-dialog
    v-model="visible"
    fullscreen
    transition="dialog-bottom-transition"
    scrim="rgba(11, 13, 18, 0.92)"
  >
    <div class="pr-overlay" role="dialog" aria-labelledby="pr-overlay-title">
      <div class="pr-overlay__burst" aria-hidden="true" />
      <v-icon icon="mdi-trophy" size="64" color="primary" class="pr-overlay__icon" />
      <h2 id="pr-overlay-title" class="pr-overlay__title">¡Nuevo récord!</h2>
      <p class="pr-overlay__subtitle">
        Superaste tu máximo histórico en {{ list.length }} ejercicio(s).
      </p>

      <ul class="pr-overlay__list">
        <li v-for="(pr, idx) in list" :key="pr.id || idx" class="pr-overlay__item">
          <span class="pr-overlay__name">{{ pr.exercise_name }}</span>
          <span class="pr-overlay__stats">
            {{ pr.weight }} kg × {{ pr.reps }}
            <span v-if="pr.previous_max != null" class="pr-overlay__prev">
              (antes {{ pr.previous_max }} kg)
            </span>
          </span>
        </li>
      </ul>

      <v-btn color="primary" class="font-weight-bold mt-6" rounded="lg" @click="close">
        ¡Vamos!
      </v-btn>
    </div>
  </v-dialog>
</template>

<style scoped>
.pr-overlay {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
  text-align: center;
  background: radial-gradient(ellipse at 50% 20%, rgba(0, 229, 255, 0.18), transparent 55%),
    #0b0d12;
  color: #fff;
}

.pr-overlay__burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 30%, rgba(0, 229, 255, 0.12), transparent 35%),
    radial-gradient(circle at 80% 40%, rgba(255, 193, 7, 0.1), transparent 30%);
  animation: pr-pulse 1.6s ease-in-out infinite alternate;
}

.pr-overlay__icon {
  position: relative;
  z-index: 1;
  animation: pr-pop 0.55s cubic-bezier(0.2, 1.4, 0.4, 1);
}

.pr-overlay__title {
  position: relative;
  z-index: 1;
  margin: 0.75rem 0 0.35rem;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.pr-overlay__subtitle {
  position: relative;
  z-index: 1;
  margin: 0 0 1.25rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  max-width: 22rem;
}

.pr-overlay__list {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  width: min(100%, 22rem);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.pr-overlay__item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.22);
  text-align: left;
}

.pr-overlay__name {
  font-weight: 700;
  font-size: 0.95rem;
}

.pr-overlay__stats {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}

.pr-overlay__prev {
  color: var(--tf-on-surface-muted, #a8b0bc);
  margin-left: 0.25rem;
}

@keyframes pr-pop {
  from { transform: scale(0.4); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pr-pulse {
  from { opacity: 0.65; }
  to { opacity: 1; }
}
</style>
