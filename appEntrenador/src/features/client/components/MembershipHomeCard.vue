<script setup>
/**
 * Meta de membresía bajo el saludo (patrón home apps fitness modernas).
 * Si está vencida / bloqueada: acciones sutiles Chat | WhatsApp (no CTA grande).
 */
import { computed } from 'vue';
import { formatMoneyCop } from '../../../shared/membership/money.js';
import {
  formatMembershipDate,
  normalizeMembershipPeriod,
} from '../../../shared/membership/period.js';
import { getMembershipHomeState } from '../utils/membershipUi.js';
import ClientMembershipContactActions from './ClientMembershipContactActions.vue';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
  forcedBlocked: {
    type: Boolean,
    default: false,
  },
});

const normalized = computed(() => normalizeMembershipPeriod(props.membership));

const state = computed(() => (
  getMembershipHomeState(normalized.value, props.forcedBlocked)
));

const label = computed(() => {
  const m = normalized.value;
  const s = state.value;
  if (!s || !m) return '';

  if (s.blocked) return 'Membresía vencida';
  if (m.status === 'owing') {
    const due = m.amount_due != null ? Number(m.amount_due) : null;
    if (due != null && due > 0) {
      return `Por pagar ${formatMoneyCop(due)}`;
    }
    return 'Pago pendiente';
  }

  const days = m.days_remaining;
  if (days == null || !Number.isFinite(Number(days))) return 'Plan mensual';
  const n = Math.max(0, Number(days));
  if (s.expiring) {
    return n === 1 ? 'Vence mañana' : `Vence en ${n} días`;
  }
  return n === 1 ? '1 día restante' : `${n} días restantes`;
});

const rangeTitle = computed(() => {
  const m = normalized.value;
  if (!m?.period_start) return label.value;
  return `${formatMembershipDate(m.period_start)} → ${formatMembershipDate(m.period_end)}`;
});

/** Contacto sutil en home solo cuando hay bloqueo / vencida / owing. */
const showSubtleContact = computed(() => {
  const s = state.value;
  if (!s) return false;
  if (s.blocked) return true;
  return String(normalized.value?.status || '').toLowerCase() === 'owing';
});

const contactNote = computed(() => (
  state.value?.blocked
    ? 'Renueva con tu entrenador'
    : 'Regulariza el pago con tu entrenador'
));

const contactPrefill = computed(() => (
  state.value?.blocked
    ? 'Hola, quiero renovar mi membresía en Trainfit.'
    : 'Hola, quiero regularizar el pago de mi membresía en Trainfit.'
));
</script>

<template>
  <div v-if="state && label" class="mem-meta-wrap">
    <p
      class="mem-meta"
      :class="`mem-meta--${state.tone}`"
      :title="rangeTitle"
    >
      <span class="mem-meta__dot" aria-hidden="true" />
      <span class="mem-meta__text">{{ label }}</span>
    </p>

    <ClientMembershipContactActions
      v-if="showSubtleContact"
      density="subtle"
      :enabled="showSubtleContact"
      :note="contactNote"
      :prefill-text="contactPrefill"
      :tone="state.blocked ? 'danger' : 'warn'"
      class="mem-meta__contact"
    />
  </div>
</template>

<style scoped>
.mem-meta-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  margin: 0.28rem 0 0;
}

.mem-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.mem-meta__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mem-meta--ok .mem-meta__dot {
  background: #00e5ff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.55);
}

.mem-meta--ok .mem-meta__text {
  color: #a8b0bc;
}

.mem-meta--warn .mem-meta__dot {
  background: #ffb020;
  box-shadow: 0 0 8px rgba(255, 176, 32, 0.45);
}

.mem-meta--warn .mem-meta__text {
  color: #ffc857;
}

.mem-meta--danger .mem-meta__dot {
  background: #ff5c5c;
  box-shadow: 0 0 8px rgba(255, 92, 92, 0.45);
}

.mem-meta--danger .mem-meta__text {
  color: #ff8a80;
}

.mem-meta__contact {
  margin-top: 0.4rem;
  max-width: 100%;
}

/* En home el bloque sutil es más compacto bajo el saludo */
.mem-meta__contact :deep(.mca--subtle) {
  margin-top: 0;
  padding: 0.4rem 0.55rem;
}
</style>
