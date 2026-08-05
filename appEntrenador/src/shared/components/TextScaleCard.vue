<script setup>
/**
 * In-app text size control — PWAs often ignore OS font size.
 * Pinch-zoom is off (ADR-0008); this is the primary scale mitigation.
 * Scales UI via --tf-font-scale → html font-size (theme-base.css).
 * Avoid CSS zoom on html (breaks shell/chat layout).
 */
import { useTextScale } from '../composables/useTextScale.js';

const { scaleId, presets, setScale } = useTextScale();

const options = Object.entries(presets).map(([id, preset]) => ({
  id,
  label: preset.label,
  value: preset.value,
}));

function onSelect(id) {
  setScale(id);
}
</script>

<template>
  <section class="tf-text-scale" aria-labelledby="tf-text-scale-title">
    <header class="tf-text-scale__header">
      <h2 id="tf-text-scale-title" class="tf-text-scale__title">
        Tamaño del texto
      </h2>
      <p class="tf-text-scale__subtitle">
        Ajusta el tamaño de la letra en Trainfit para leer con más comodidad.
      </p>
    </header>

    <div
      class="tf-text-scale__options"
      role="radiogroup"
      aria-labelledby="tf-text-scale-title"
    >
      <button
        v-for="opt in options"
        :key="opt.id"
        type="button"
        class="tf-text-scale__btn"
        :class="{ 'tf-text-scale__btn--active': scaleId === opt.id }"
        role="radio"
        :aria-checked="scaleId === opt.id"
        :aria-label="`${opt.label} (${Math.round(opt.value * 100)}%)`"
        @click="onSelect(opt.id)"
      >
        <span
          class="tf-text-scale__sample"
          :style="{ fontSize: `${0.85 * opt.value}rem` }"
          aria-hidden="true"
        >
          Aa
        </span>
        <span class="tf-text-scale__label">{{ opt.label }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.tf-text-scale {
  background: var(--tf-surface, #1e1e1e);
  border: 1px solid var(--tf-border, rgba(255, 255, 255, 0.28));
  border-radius: 12px;
  padding: 1rem 1rem 1.1rem;
}

.tf-text-scale__header {
  margin-bottom: 0.85rem;
}

.tf-text-scale__title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.tf-text-scale__subtitle {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-text-scale__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.tf-text-scale__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 4.5rem;
  padding: 0.55rem 0.35rem;
  border-radius: 10px;
  border: 1px solid var(--tf-border, rgba(255, 255, 255, 0.28));
  background: transparent;
  color: var(--tf-on-surface, #fff);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.tf-text-scale__btn:hover {
  background: var(--tf-menu-hover, rgba(0, 229, 255, 0.16));
}

.tf-text-scale__btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid var(--tf-primary, #00e5ff));
  outline-offset: var(--tf-focus-offset, 2px);
}

.tf-text-scale__btn--active {
  border-color: var(--tf-primary, #00e5ff);
  background: var(--tf-menu-hover, rgba(0, 229, 255, 0.16));
}

.tf-text-scale__sample {
  font-weight: 700;
  line-height: 1;
  color: var(--tf-on-surface, #fff);
}

.tf-text-scale__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-align: center;
}

.tf-text-scale__btn--active .tf-text-scale__label {
  color: var(--tf-primary, #00e5ff);
}
</style>
