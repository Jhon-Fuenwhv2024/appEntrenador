<script setup>
/**
 * Resumen compacto pero completo de membresía / pago en Mi Perfil (Feature 040).
 */
import { computed } from 'vue';
import {
  formatMembershipDate,
  normalizeMembershipPeriod,
} from '../../../shared/membership/period.js';
import {
  getMembershipHomeState,
  getMembershipProgress,
  isMembershipAccessBlocked,
} from '../utils/membershipUi.js';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
});

const normalized = computed(() => normalizeMembershipPeriod(props.membership));
const state = computed(() => getMembershipHomeState(normalized.value, false));

const paymentLabel = computed(() => {
  const m = normalized.value;
  if (!m?.status) return 'Sin plan';
  const status = String(m.status).toLowerCase();
  if (status === 'owing') return 'Debe el mes';
  if (status === 'expired') return 'Vencida';
  if (status === 'active') return 'Al día';
  return status;
});

const paymentTone = computed(() => {
  const m = normalized.value;
  if (!m?.status) return 'muted';
  const status = String(m.status).toLowerCase();
  if (status === 'owing') return 'warn';
  if (status === 'expired') return 'danger';
  if (status === 'active') return state.value?.expiring ? 'warn' : 'ok';
  return 'muted';
});

const daysText = computed(() => {
  const days = normalized.value?.days_remaining;
  if (days == null || !Number.isFinite(Number(days))) return '—';
  const n = Math.max(0, Number(days));
  return n === 1 ? '1 día' : `${n} días`;
});

const accessBlocked = computed(() => isMembershipAccessBlocked(normalized.value));

const accessLabel = computed(() => {
  if (!normalized.value) return '—';
  if (accessBlocked.value) return 'Bloqueado';
  if (normalized.value.block_on_unpaid) return 'Activo (con bloqueo)';
  return 'Permitido';
});

const progressPct = computed(() => (
  Math.round(getMembershipProgress(normalized.value) * 100)
));

const empty = computed(() => !normalized.value?.status);

const startLabel = computed(() => formatMembershipDate(normalized.value?.period_start));
const endLabel = computed(() => formatMembershipDate(normalized.value?.period_end));
</script>

<template>
  <section
    class="pmc"
    :class="empty ? 'pmc--empty' : `pmc--${paymentTone}`"
    aria-label="Membresía y pago"
  >
    <div class="pmc__top">
      <div>
        <p class="pmc__eyebrow">Membresía mensual</p>
        <p v-if="empty" class="pmc__days">Sin plan configurado</p>
        <p v-else class="pmc__days">
          <strong>{{ daysText }}</strong>
          <span class="pmc__days-muted">restantes</span>
        </p>
      </div>
      <span class="pmc__badge" :class="`pmc__badge--${paymentTone}`">
        {{ paymentLabel }}
      </span>
    </div>

    <template v-if="empty">
      <p class="pmc__empty">
        Cuando tu entrenador configure el plan, verás pago y vigencia aquí.
      </p>
    </template>

    <template v-else>
      <div class="pmc__track" aria-hidden="true">
        <div class="pmc__track-fill" :style="{ width: `${progressPct}%` }" />
      </div>

      <dl class="pmc__meta">
        <div>
          <dt>Inicio</dt>
          <dd>{{ startLabel }}</dd>
        </div>
        <div>
          <dt>Vence</dt>
          <dd>{{ endLabel }}</dd>
        </div>
        <div>
          <dt>Pago</dt>
          <dd>{{ paymentLabel }}</dd>
        </div>
        <div>
          <dt>Rutinas</dt>
          <dd :class="{ 'pmc__dd--danger': accessBlocked }">{{ accessLabel }}</dd>
        </div>
      </dl>

      <p
        v-if="paymentTone === 'warn' || paymentTone === 'danger'"
        class="pmc__note"
      >
        Habla con tu entrenador para renovar o regularizar el pago.
      </p>
    </template>
  </section>
</template>

<style scoped>
.pmc {
  padding: 0.7rem 0.8rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.pmc--ok {
  border-color: rgba(0, 229, 255, 0.2);
}

.pmc--warn {
  border-color: rgba(255, 176, 32, 0.28);
}

.pmc--danger {
  border-color: rgba(255, 92, 92, 0.3);
}

.pmc__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.pmc__eyebrow {
  margin: 0;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8b929e;
}

.pmc__days {
  margin: 0.15rem 0 0;
  font-size: 0.92rem;
  color: #c5cad3;
  line-height: 1.2;
}

.pmc__days strong {
  color: #fff;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.pmc__days-muted {
  margin-left: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #8b929e;
}

.pmc__badge {
  flex-shrink: 0;
  padding: 0.14rem 0.45rem;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pmc__badge--ok {
  color: #0b0d12;
  background: #00e5ff;
}

.pmc__badge--warn {
  color: #0b0d12;
  background: #ffb020;
}

.pmc__badge--danger {
  color: #fff;
  background: #e53935;
}

.pmc__badge--muted {
  color: #c5cad3;
  background: rgba(255, 255, 255, 0.08);
}

.pmc__empty {
  margin: 0.4rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: #8b929e;
}

.pmc__track {
  margin-top: 0.45rem;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pmc__track-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease;
}

.pmc--ok .pmc__track-fill {
  background: #00e5ff;
}

.pmc--warn .pmc__track-fill {
  background: #ffb020;
}

.pmc--danger .pmc__track-fill {
  background: #ff5c5c;
}

.pmc__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 0.65rem;
  margin: 0.55rem 0 0;
}

.pmc__meta dt {
  margin: 0;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b929e;
}

.pmc__meta dd {
  margin: 0.08rem 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #e8eaed;
  line-height: 1.2;
}

.pmc__dd--danger {
  color: #ff8a80 !important;
}

.pmc__note {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  line-height: 1.3;
  color: #ffc857;
}
</style>
