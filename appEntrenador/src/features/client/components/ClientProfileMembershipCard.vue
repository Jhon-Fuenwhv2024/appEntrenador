<script setup>
/**
 * Resumen compacto de membresía / pago en Mi Perfil (Feature 040).
 * - Por vencer (≤7d): CTA prominente Chat + WhatsApp
 * - Vencida / pago pendiente: acciones sutiles (text links)
 */
import { computed } from 'vue';
import { formatMoneyCop } from '../../../shared/membership/money.js';
import {
  formatMembershipDate,
  normalizeMembershipPeriod,
} from '../../../shared/membership/period.js';
import {
  getMembershipHomeState,
  isMembershipAccessBlocked,
  isMembershipExpiringSoon,
} from '../utils/membershipUi.js';
import ClientMembershipContactActions from './ClientMembershipContactActions.vue';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
});

const normalized = computed(() => normalizeMembershipPeriod(props.membership));
const state = computed(() => getMembershipHomeState(normalized.value, false));

const planNameLabel = computed(() => normalized.value?.membership_type_name || null);

/**
 * Desglose claro cuando hay precio: plan / abonado / por pagar.
 * Evita confusión de “Saldo $X” bajo el título “Pago”.
 */
const paymentBreakdown = computed(() => {
  const m = normalized.value;
  if (!m?.status) return null;

  const status = String(m.status).toLowerCase();
  const planPrice = m.plan_price != null ? Number(m.plan_price) : NaN;
  const hasPlanPrice = Number.isFinite(planPrice) && planPrice > 0;
  const amountPaidRaw = m.amount_paid != null ? Number(m.amount_paid) : 0;
  const amountPaid = Number.isFinite(amountPaidRaw) ? Math.max(0, amountPaidRaw) : 0;
  const amountDueRaw = m.amount_due != null ? Number(m.amount_due) : NaN;
  const amountDue = Number.isFinite(amountDueRaw)
    ? Math.max(0, amountDueRaw)
    : (hasPlanPrice ? Math.max(0, planPrice - amountPaid) : null);

  if (status === 'owing' && hasPlanPrice) {
    return {
      mode: 'owing',
      planLabel: formatMoneyCop(planPrice),
      paidLabel: formatMoneyCop(amountPaid),
      dueLabel: formatMoneyCop(amountDue),
      paidPct: Math.min(100, Math.round((amountPaid / planPrice) * 100)),
    };
  }

  if (status === 'active' && hasPlanPrice) {
    return {
      mode: 'active',
      summary: formatMoneyCop(planPrice),
    };
  }

  if (status === 'owing') {
    return { mode: 'owing-simple', summary: 'Pago pendiente' };
  }
  if (status === 'expired') {
    return { mode: 'expired', summary: 'Vencida' };
  }
  if (status === 'active') {
    return { mode: 'active', summary: 'Al día' };
  }
  return { mode: 'other', summary: status };
});

const showPaymentBreakdown = computed(() => paymentBreakdown.value?.mode === 'owing');

const paymentLabel = computed(() => paymentBreakdown.value?.summary || 'Sin plan');

const badgeLabel = computed(() => {
  const m = normalized.value;
  if (!m?.status) return 'Sin plan';
  const status = String(m.status).toLowerCase();
  if (status === 'owing') return 'Pendiente';
  if (status === 'expired') return 'Vencida';
  if (status === 'active') return 'Al día';
  return status;
});

const paymentTone = computed(() => {
  const m = normalized.value;
  if (!m?.status) return 'muted';
  if (state.value?.blocked) return 'danger';
  const status = String(m.status).toLowerCase();
  if (status === 'owing') return 'warn';
  if (status === 'expired') return 'danger';
  if (status === 'active') return state.value?.expiring ? 'warn' : 'ok';
  return 'muted';
});

/** Usa estado unificado: vencida/bloqueada → 0 días (no el calendario). */
const daysText = computed(() => {
  const s = state.value;
  if (s?.blocked) {
    return s.unit ? `${s.headline} ${s.unit}` : String(s.headline ?? '0 días');
  }
  if (s?.headline != null && s.headline !== '—') {
    return s.unit ? `${s.headline} ${s.unit}` : String(s.headline);
  }
  const days = normalized.value?.days_remaining;
  if (days == null || !Number.isFinite(Number(days))) return '—';
  const n = Math.max(0, Number(days));
  return n === 1 ? '1 día' : `${n} días`;
});

const accessBlocked = computed(() => (
  state.value?.blocked || isMembershipAccessBlocked(normalized.value)
));

const accessLabel = computed(() => {
  if (!normalized.value) return '—';
  if (accessBlocked.value) return 'Bloqueado';
  if (normalized.value.block_on_unpaid) return 'Activo (bloqueo al vencer + 3d gracia)';
  return 'Permitido';
});

const progressPct = computed(() => {
  const s = state.value;
  if (s) return Math.round((s.progress ?? 0) * 100);
  return 0;
});

const empty = computed(() => !normalized.value?.status);

const startLabel = computed(() => formatMembershipDate(normalized.value?.period_start));
const endLabel = computed(() => formatMembershipDate(normalized.value?.period_end));

const renewKind = computed(() => {
  if (accessBlocked.value || String(normalized.value?.status || '').toLowerCase() === 'expired') {
    return 'expired';
  }
  if (String(normalized.value?.status || '').toLowerCase() === 'owing') {
    return 'owing';
  }
  if (isMembershipExpiringSoon(normalized.value)) return 'expiring';
  return null;
});

const showContact = computed(() => renewKind.value != null);

/** Prominente solo “por vencer”; vencida/owing → sutil. */
const contactDensity = computed(() => (
  renewKind.value === 'expiring' ? 'prominent' : 'subtle'
));

const contactNote = computed(() => {
  if (renewKind.value === 'expired') {
    return 'Habla con tu entrenador para renovar o regularizar el pago.';
  }
  if (renewKind.value === 'owing') {
    return 'Contáctalo para regularizar el pago y mantener el acceso.';
  }
  const days = normalized.value?.days_remaining;
  const n = days == null ? null : Math.max(0, Number(days));
  if (n === 0) return 'Tu plan vence hoy. Contáctalo para renovar.';
  if (n === 1) return 'Tu plan vence mañana. Contáctalo para renovar.';
  if (n != null && Number.isFinite(n)) {
    return `Tu plan vence en ${n} días. Contáctalo para renovar.`;
  }
  return 'Contáctalo para renovar a tiempo.';
});

const contactPrefill = computed(() => (
  renewKind.value === 'owing'
    ? 'Hola, quiero regularizar el pago de mi membresía en Trainfit.'
    : 'Hola, quiero renovar mi membresía en Trainfit.'
));
</script>

<template>
  <section
    class="pmc"
    :class="empty ? 'pmc--empty' : `pmc--${paymentTone}`"
    aria-label="Membresía y pago"
  >
    <div class="pmc__top">
      <div>
        <p class="pmc__eyebrow">
          {{ planNameLabel || 'Membresía mensual' }}
        </p>
        <p v-if="empty" class="pmc__days">Sin plan configurado</p>
        <p v-else class="pmc__days">
          <strong>{{ daysText }}</strong>
          <span class="pmc__days-muted">restantes</span>
        </p>
      </div>
      <span class="pmc__badge" :class="`pmc__badge--${paymentTone}`">
        {{ badgeLabel }}
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
        <div v-if="!showPaymentBreakdown">
          <dt>Pago</dt>
          <dd>{{ paymentLabel }}</dd>
        </div>
        <div>
          <dt>Rutinas</dt>
          <dd :class="{ 'pmc__dd--danger': accessBlocked }">{{ accessLabel }}</dd>
        </div>
      </dl>

      <div
        v-if="showPaymentBreakdown"
        class="pmc-pay"
        aria-label="Detalle del pago"
      >
        <div class="pmc-pay__head">
          <p class="pmc-pay__title">Detalle del pago</p>
          <span class="pmc-pay__due-chip">
            Por pagar {{ paymentBreakdown.dueLabel }}
          </span>
        </div>

        <div
          class="pmc-pay__track"
          role="progressbar"
          :aria-valuenow="paymentBreakdown.paidPct"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Abonado ${paymentBreakdown.paidPct}% del plan`"
        >
          <div
            class="pmc-pay__track-fill"
            :style="{ width: `${paymentBreakdown.paidPct}%` }"
          />
        </div>

        <dl class="pmc-pay__grid">
          <div>
            <dt>Valor del plan</dt>
            <dd>{{ paymentBreakdown.planLabel }}</dd>
          </div>
          <div>
            <dt>Ya abonado</dt>
            <dd class="pmc-pay__paid">{{ paymentBreakdown.paidLabel }}</dd>
          </div>
          <div class="pmc-pay__grid-due">
            <dt>Por pagar</dt>
            <dd>{{ paymentBreakdown.dueLabel }}</dd>
          </div>
        </dl>
      </div>

      <ClientMembershipContactActions
        v-if="showContact"
        :density="contactDensity"
        :enabled="showContact"
        :note="contactNote"
        :prefill-text="contactPrefill"
        :tone="renewKind === 'owing' ? 'warn' : 'danger'"
      />
    </template>
  </section>
</template>

<style scoped>
.pmc {
  padding: 1.05rem 1.1rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%),
    #151820;
}

.pmc--ok {
  border-color: rgba(255, 255, 255, 0.08);
}

.pmc--warn {
  border-color: rgba(255, 176, 32, 0.22);
}

.pmc--danger {
  border-color: rgba(255, 92, 92, 0.28);
}

.pmc__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pmc__eyebrow {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc__days {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.25;
}

.pmc__days strong {
  color: var(--tf-on-surface, #ffffff);
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
}

.pmc__days-muted {
  margin-left: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc__badge {
  flex-shrink: 0;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pmc__badge--ok {
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
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
  margin: 0.55rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc__track {
  margin-top: 0.75rem;
  height: 4px;
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
  background: var(--tf-primary, #00e5ff);
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
  gap: 0.75rem 1rem;
  margin: 0.9rem 0 0;
  padding: 0.85rem 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.pmc__meta dt {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc__meta dd {
  margin: 0.2rem 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
  line-height: 1.25;
}

.pmc__dd--danger {
  color: #ff8a80 !important;
}

.pmc-pay {
  margin-top: 0.85rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 176, 32, 0.22);
  background:
    linear-gradient(135deg, rgba(255, 176, 32, 0.08), transparent 55%),
    rgba(255, 255, 255, 0.03);
}

.pmc-pay__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.pmc-pay__title {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc-pay__due-chip {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0b0d12;
  background: #ffb020;
  font-variant-numeric: tabular-nums;
}

.pmc-pay__track {
  margin-top: 0.7rem;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pmc-pay__track-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffb020, #ffd06a);
  transition: width 0.35s ease;
}

.pmc-pay__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem 0.85rem;
  margin: 0.75rem 0 0;
}

.pmc-pay__grid dt {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc-pay__grid dd {
  margin: 0.15rem 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.015em;
  color: var(--tf-on-surface, #e8eaed);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.pmc-pay__paid {
  color: #c8f0c8 !important;
}

.pmc-pay__grid-due {
  grid-column: 1 / -1;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.pmc-pay__grid-due dt {
  margin: 0;
}

.pmc-pay__grid-due dd {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffb020;
}
</style>
