<script setup>
/**
 * Recordatorio personal de membresía del gym físico (Feature 082).
 * Compacto: vacío → form; guardado → resumen + Editar.
 */
import { computed, reactive, ref, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { formatMembershipDate } from '../../../shared/membership/period.js';
import {
  deleteMyGymMembership,
  upsertMyGymMembership,
} from '../api/gymMembershipApi.js';

const props = defineProps({
  membership: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['updated', 'notify']);

const form = reactive({
  gym_name: '',
  expires_on: '',
  notify_enabled: true,
});

const editing = ref(false);
const saving = ref(false);
const removing = ref(false);
const formError = ref('');

const configured = computed(() => Boolean(props.membership?.expires_on));

/** Form solo si no hay datos o el usuario pidió editar. */
const showForm = computed(() => !configured.value || editing.value);

function syncFormFromProps(m) {
  form.gym_name = m?.gym_name || '';
  form.expires_on = m?.expires_on || '';
  form.notify_enabled = m?.notify_enabled !== false;
  formError.value = '';
}

watch(
  () => props.membership,
  (m) => {
    syncFormFromProps(m);
    if (!m?.expires_on) editing.value = false;
  },
  { immediate: true },
);

const daysRemaining = computed(() => {
  const d = props.membership?.days_remaining;
  if (d == null || !Number.isFinite(Number(d))) return null;
  return Number(d);
});

const daysLabel = computed(() => {
  const n = daysRemaining.value;
  if (n == null) return null;
  if (n < 0) {
    const past = Math.abs(n);
    return past === 1 ? 'Venció ayer' : `Venció hace ${past} días`;
  }
  if (n === 0) return 'Vence hoy';
  if (n === 1) return '1 día restante';
  return `${n} días restantes`;
});

const tone = computed(() => {
  const n = daysRemaining.value;
  if (n == null) return 'muted';
  if (n < 0) return 'danger';
  if (n <= 7) return 'warn';
  return 'ok';
});

const badgeLabel = computed(() => {
  if (tone.value === 'ok') return 'Al día';
  if (tone.value === 'warn') return 'Por vencer';
  if (tone.value === 'danger') return 'Vencida';
  return '';
});

const endLabel = computed(() => formatMembershipDate(props.membership?.expires_on));

const notifySummary = computed(() => (
  props.membership?.notify_enabled !== false ? 'Avisos activos' : 'Avisos desactivados'
));

function startEdit() {
  syncFormFromProps(props.membership);
  editing.value = true;
}

function cancelEdit() {
  syncFormFromProps(props.membership);
  editing.value = false;
}

async function onSave() {
  formError.value = '';
  if (!form.expires_on) {
    formError.value = 'Indica la fecha de vencimiento.';
    return;
  }
  try {
    saving.value = true;
    const response = await upsertMyGymMembership({
      gym_name: form.gym_name?.trim() || null,
      expires_on: form.expires_on,
      notify_enabled: form.notify_enabled,
    });
    const data = response.data?.data ?? null;
    editing.value = false;
    emit('updated', data);
    emit('notify', 'Membresía del gym guardada');
  } catch (error) {
    console.error('Error guardando membresía del gym:', error);
    formError.value = getApiErrorMessage(error, 'No se pudo guardar');
    emit('notify', formError.value, 'error');
  } finally {
    saving.value = false;
  }
}

async function onRemove() {
  formError.value = '';
  try {
    removing.value = true;
    await deleteMyGymMembership();
    editing.value = false;
    emit('updated', null);
    emit('notify', 'Membresía del gym eliminada');
  } catch (error) {
    console.error('Error eliminando membresía del gym:', error);
    formError.value = getApiErrorMessage(error, 'No se pudo eliminar');
    emit('notify', formError.value, 'error');
  } finally {
    removing.value = false;
  }
}
</script>

<template>
  <section
    class="gmc"
    :class="configured ? `gmc--${tone}` : 'gmc--empty'"
    aria-label="Membresía del gimnasio"
  >
    <!-- Resumen (ya configurado, sin editar) -->
    <template v-if="configured && !showForm">
      <div class="gmc__top">
        <div class="gmc__head">
          <p class="gmc__eyebrow">Membresía del gym</p>
          <p class="gmc__days">
            <strong>{{ daysLabel }}</strong>
          </p>
        </div>
        <span class="gmc__badge" :class="`gmc__badge--${tone}`">
          {{ badgeLabel }}
        </span>
      </div>

      <dl class="gmc__summary">
        <div v-if="membership?.gym_name">
          <dt>Gym</dt>
          <dd>{{ membership.gym_name }}</dd>
        </div>
        <div>
          <dt>Vence</dt>
          <dd>{{ endLabel }}</dd>
        </div>
        <div>
          <dt>Avisos</dt>
          <dd>{{ notifySummary }}</dd>
        </div>
      </dl>

      <div class="gmc__actions gmc__actions--row">
        <v-btn
          type="button"
          color="primary"
          variant="tonal"
          size="small"
          aria-label="Editar membresía del gym"
          @click="startEdit"
        >
          Editar
        </v-btn>
      </div>
    </template>

    <!-- Form vacío o edición -->
    <template v-else>
      <div class="gmc__top">
        <div class="gmc__head">
          <p class="gmc__eyebrow">Membresía del gym</p>
          <p class="gmc__hint">
            {{ configured ? 'Actualiza tus datos' : 'Añade la fecha de vencimiento y te avisamos.' }}
          </p>
        </div>
      </div>

      <v-form class="gmc__form" @submit.prevent="onSave">
        <v-text-field
          v-model="form.gym_name"
          label="Nombre del gym (opcional)"
          variant="outlined"
          density="compact"
          hide-details="auto"
          maxlength="120"
          autocomplete="organization"
        />

        <v-text-field
          v-model="form.expires_on"
          label="Fecha de vencimiento"
          type="date"
          variant="outlined"
          density="compact"
          hide-details="auto"
          required
        />

        <v-switch
          v-model="form.notify_enabled"
          color="primary"
          density="compact"
          hide-details
          inset
          class="gmc__switch"
          label="Avisarme al vencer"
        />

        <p v-if="formError" class="gmc__error" role="alert">{{ formError }}</p>

        <div class="gmc__actions">
          <v-btn
            type="submit"
            color="primary"
            size="small"
            :loading="saving"
            :disabled="removing"
          >
            Guardar
          </v-btn>
          <v-btn
            v-if="configured"
            type="button"
            variant="text"
            size="small"
            :disabled="saving || removing"
            @click="cancelEdit"
          >
            Cancelar
          </v-btn>
          <v-btn
            v-if="configured"
            type="button"
            variant="text"
            color="error"
            size="small"
            :loading="removing"
            :disabled="saving"
            aria-label="Quitar membresía del gym"
            @click="onRemove"
          >
            Quitar
          </v-btn>
        </div>
      </v-form>
    </template>
  </section>
</template>

<style scoped>
.gmc {
  padding: 0.85rem 0.95rem 0.8rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%),
    #151820;
}

.gmc--warn {
  border-color: rgba(255, 176, 32, 0.22);
}

.gmc--danger {
  border-color: rgba(255, 92, 92, 0.28);
}

.gmc__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.gmc__eyebrow {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.gmc__days {
  margin: 0.2rem 0 0;
  line-height: 1.2;
}

.gmc__days strong {
  color: var(--tf-on-surface, #ffffff);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.gmc__hint {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.gmc__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.gmc__badge--ok {
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
}

.gmc__badge--warn {
  color: #0b0d12;
  background: #ffb020;
}

.gmc__badge--danger {
  color: #fff;
  background: #e53935;
}

.gmc__summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 0.75rem;
  margin: 0.65rem 0 0;
  padding: 0.65rem 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.gmc__summary dt {
  margin: 0;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.gmc__summary dd {
  margin: 0.1rem 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
  line-height: 1.25;
}

.gmc__form {
  margin-top: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.gmc__switch {
  margin-top: -0.15rem;
}

.gmc__error {
  margin: 0;
  font-size: 0.75rem;
  color: #ff8a80;
}

.gmc__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.gmc__actions--row {
  margin-top: 0.65rem;
}

.gmc__actions :deep(.v-btn) {
  min-height: 36px;
}

.gmc__actions :deep(.v-btn:focus-visible) {
  outline: 2px solid var(--tf-primary, #00e5ff);
  outline-offset: 2px;
}
</style>
