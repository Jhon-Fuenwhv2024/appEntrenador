<script setup>
/**
 * Aviso compacto en home: plan vencido / cupo FREE (detalle en Ajustes).
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  expired: {
    type: Boolean,
    default: false,
  },
  /** Plan efectivo FREE y hay alumnos en exceso. */
  seatLimitHint: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

const visible = computed(() => props.expired === true || props.seatLimitHint === true);

const label = computed(() => {
  if (props.expired) return 'PRO vencido';
  return 'Cupo FREE limitado';
});

const hintTitle = computed(() => {
  if (props.expired) {
    return 'Tu plan PRO venció. Abre Ajustes para ver fecha, cupo editable y cómo renovar.';
  }
  return 'En plan FREE solo puedes editar 3 alumnos. Abre Ajustes para más detalle.';
});

function goToSettings() {
  router.push('/trainer/settings');
}
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="saas-meta"
    role="status"
    :title="hintTitle"
    :aria-label="`${label}. Abrir Ajustes`"
    @click="goToSettings"
  >
    <span class="saas-meta__dot" aria-hidden="true" />
    <span class="saas-meta__text">{{ label }}</span>
    <span class="saas-meta__link" aria-hidden="true">Ajustes</span>
  </button>
</template>

<style scoped>
.saas-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.28rem 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  color: #ff8a80;
  text-align: left;
}

.saas-meta:focus-visible {
  outline: 2px solid rgba(0, 229, 255, 0.65);
  outline-offset: 3px;
  border-radius: 4px;
}

.saas-meta__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #ff5c5c;
  box-shadow: 0 0 8px rgba(255, 92, 92, 0.45);
}

.saas-meta__text {
  min-width: 0;
}

.saas-meta__link {
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
