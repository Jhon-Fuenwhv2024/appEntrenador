<script setup>
/**
 * Resumen compacto de membresía / pago en Mi Perfil (Feature 040).
 * CTA renovar (chat + WhatsApp) solo cuando el plan está por vencer (≤7 días).
 */
import { computed, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  formatMembershipDate,
  normalizeMembershipPeriod,
} from '../../../shared/membership/period.js';
import { getChatPartner } from '../../messaging/api/messagesApi.js';
import {
  getMembershipHomeState,
  isMembershipAccessBlocked,
  isMembershipExpiringSoon,
} from '../utils/membershipUi.js';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
});

const router = useRouter();
const trainerPhone = shallowRef(null);
const trainerName = shallowRef('');
const contactLoading = shallowRef(false);

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
  if (normalized.value.block_on_unpaid) return 'Activo (con bloqueo)';
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

/** Solo plan activo a ≤7 días del vencimiento. */
const showRenewCta = computed(() => isMembershipExpiringSoon(normalized.value));

/** Aviso de texto sin botones (vencida / pago pendiente). */
const showStatusNote = computed(() => {
  if (showRenewCta.value) return false;
  return paymentTone.value === 'warn' || paymentTone.value === 'danger';
});

const whatsappUrl = computed(() => buildWhatsAppUrl(
  trainerPhone.value,
  'Hola, quiero renovar mi membresía en Trainfit.',
));

const renewSubtitle = computed(() => {
  const days = normalized.value?.days_remaining;
  const n = days == null ? null : Math.max(0, Number(days));
  if (n === 0) return 'Tu plan vence hoy. Contáctalo para renovar.';
  if (n === 1) return 'Tu plan vence mañana. Contáctalo para renovar.';
  if (n != null && Number.isFinite(n)) {
    return `Tu plan vence en ${n} días. Contáctalo para renovar.`;
  }
  return 'Contáctalo para renovar a tiempo.';
});

async function loadTrainerContact() {
  contactLoading.value = true;
  try {
    const response = await getChatPartner();
    const partner = response.data?.data ?? null;
    trainerPhone.value = partner?.telefono ?? null;
    trainerName.value = partner?.nombre || 'tu entrenador';
  } catch (error) {
    console.warn('No se pudo cargar contacto del entrenador:', error);
    trainerPhone.value = null;
    trainerName.value = 'tu entrenador';
  } finally {
    contactLoading.value = false;
  }
}

function goToChat() {
  router.push({ name: 'ClientMessages' });
}

watch(
  showRenewCta,
  (show) => {
    if (show) loadTrainerContact();
  },
  { immediate: true },
);
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
        v-if="showStatusNote"
        class="pmc__note"
      >
        Habla con tu entrenador para renovar o regularizar el pago.
      </p>

      <div
        v-if="showRenewCta"
        class="pmc__renew"
        role="region"
        aria-label="Renovar membresía"
      >
        <div class="pmc__renew-copy">
          <p class="pmc__renew-kicker">Por vencer</p>
          <p class="pmc__renew-title">Habla con {{ trainerName || 'tu entrenador' }}</p>
          <p class="pmc__renew-sub">{{ renewSubtitle }}</p>
        </div>

        <div class="pmc__renew-actions">
          <button
            type="button"
            class="pmc__pill pmc__pill--chat"
            aria-label="Abrir chat con tu entrenador"
            @click="goToChat"
          >
            <v-icon icon="mdi-message-text-outline" size="18" aria-hidden="true" />
            <span>Chat</span>
          </button>

          <a
            v-if="whatsappUrl"
            :href="whatsappUrl"
            class="pmc__pill pmc__pill--wa"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir WhatsApp con el número de tu entrenador"
          >
            <v-icon icon="mdi-whatsapp" size="18" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>

          <p
            v-else-if="!contactLoading"
            class="pmc__renew-hint"
          >
            WhatsApp no disponible: tu entrenador aún no agregó teléfono en su perfil.
          </p>
        </div>
      </div>
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

.pmc__note {
  margin: 0.85rem 0 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--tf-on-surface, #e8ecf1);
  background: rgba(255, 176, 32, 0.08);
  border: 1px solid rgba(255, 176, 32, 0.18);
}

/* CTA renovar — solo “por vencer” */
.pmc__renew {
  margin-top: 0.9rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(255, 176, 32, 0.1) 0%, rgba(0, 229, 255, 0.04) 100%);
  border: 1px solid rgba(255, 176, 32, 0.22);
}

.pmc__renew-copy {
  margin-bottom: 0.75rem;
}

.pmc__renew-kicker {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffc857;
}

.pmc__renew-title {
  margin: 0.28rem 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--tf-on-surface, #ffffff);
  line-height: 1.25;
}

.pmc__renew-sub {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pmc__renew-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.pmc__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  min-width: 44px;
  padding: 0 0.95rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8125rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
}

.pmc__pill:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.pmc__pill:active {
  transform: scale(0.98);
}

.pmc__pill--chat {
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
  border-color: transparent;
}

.pmc__pill--chat:hover {
  background: #33ebff;
}

.pmc__pill--wa {
  color: #e8f8ef;
  background: rgba(37, 211, 102, 0.14);
  border-color: rgba(37, 211, 102, 0.42);
}

.pmc__pill--wa:hover {
  background: rgba(37, 211, 102, 0.22);
  border-color: rgba(37, 211, 102, 0.55);
}

.pmc__renew-hint {
  margin: 0;
  flex: 1 1 100%;
  font-size: 0.6875rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>
