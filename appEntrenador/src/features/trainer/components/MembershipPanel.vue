<script setup>
/**
 * Panel trainer compacto: membresía mensual del alumno (Feature 040).
 * Solo elige inicio; el vencimiento (+30 días) lo calcula el backend.
 */
import { computed, onMounted, reactive, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  formatMembershipDate,
  monthlyPeriodEnd,
} from '../../../shared/membership/period.js';
import { getClientMembership, upsertClientMembership } from '../api/membershipApi.js';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify', 'updated']);

const STATUS_OPTIONS = [
  { value: 'active', title: 'Al día' },
  { value: 'owing', title: 'Pendiente' },
  { value: 'expired', title: 'Vencido' },
];

const loading = shallowRef(false);
const saving = shallowRef(false);
const loadError = shallowRef('');
const notesOpen = shallowRef(false);

const form = reactive({
  status: 'active',
  period_start: '',
  period_end: '',
  notes: '',
  block_on_unpaid: false,
});

const computedPeriodEnd = computed(() => {
  if (form.period_start) return monthlyPeriodEnd(form.period_start);
  return form.period_end || '';
});

const periodEndLabel = computed(() => {
  const end = computedPeriodEnd.value;
  if (!end) return '—';
  return formatMembershipDate(end);
});

const periodRangeHint = computed(() => {
  if (!form.period_start || !computedPeriodEnd.value) return '';
  return `${formatMembershipDate(form.period_start)} → ${formatMembershipDate(computedPeriodEnd.value)}`;
});

function todayDateOnly() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resetForm() {
  form.status = 'active';
  form.period_start = todayDateOnly();
  form.period_end = '';
  form.notes = '';
  form.block_on_unpaid = false;
  notesOpen.value = false;
}

function applyMembership(data) {
  if (!data) {
    resetForm();
    return;
  }
  form.status = data.status || 'active';
  form.period_start = data.period_start
    ? String(data.period_start).slice(0, 10)
    : todayDateOnly();
  form.period_end = data.period_end ? String(data.period_end).slice(0, 10) : '';
  form.notes = data.notes || '';
  form.block_on_unpaid = Boolean(data.block_on_unpaid);
  notesOpen.value = Boolean(form.notes);
}

async function loadMembership() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getClientMembership(props.clientId);
    applyMembership(response.data?.data ?? null);
  } catch (error) {
    console.error('Error cargando membresía:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar la membresía');
    resetForm();
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  if (!form.status) {
    emit('notify', { text: 'Selecciona un estado de membresía', color: 'warning' });
    return;
  }
  if (!form.period_start) {
    emit('notify', { text: 'Indica la fecha de inicio del mes', color: 'warning' });
    return;
  }

  const payload = {
    status: form.status,
    period_start: form.period_start,
    notes: form.notes?.trim() || null,
    block_on_unpaid: Boolean(form.block_on_unpaid),
  };

  try {
    saving.value = true;
    const response = await upsertClientMembership(props.clientId, payload);
    const data = response.data?.data ?? null;
    applyMembership(data);
    emit('notify', { text: 'Membresía guardada', color: 'success' });
    emit('updated', data);
  } catch (error) {
    console.error('Error guardando membresía:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo guardar la membresía'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

watch(() => props.clientId, () => {
  loadMembership();
});

onMounted(() => {
  loadMembership();
});
</script>

<template>
  <section class="mp" aria-labelledby="mp-title">
    <header class="mp__head">
      <div class="mp__head-text">
        <h3 id="mp-title" class="mp__title">Membresía</h3>
        <span class="mp__plan">Mensual · 30 días</span>
      </div>
      <v-btn
        type="submit"
        form="mp-form"
        color="primary"
        size="small"
        :loading="saving"
        :disabled="loading"
      >
        Guardar
      </v-btn>
    </header>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      height="2"
      class="mb-2"
    />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-2"
    >
      {{ loadError }}
    </v-alert>

    <form id="mp-form" class="mp__form" @submit.prevent="onSave">
      <div class="mp__status-row">
        <span class="mp__label">Estado</span>
        <div class="mp__chips" role="group" aria-label="Estado de pago">
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            type="button"
            class="mp__chip"
            :class="{
              'mp__chip--on': form.status === opt.value,
              [`mp__chip--${opt.value}`]: form.status === opt.value,
            }"
            :disabled="loading || saving"
            @click="form.status = opt.value"
          >
            {{ opt.title }}
          </button>
        </div>
      </div>

      <div class="mp__period">
        <v-text-field
          v-model="form.period_start"
          type="date"
          label="Inicio"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="loading || saving"
          class="mp__date"
        />
        <div class="mp__end">
          <span class="mp__end-kicker">Vence</span>
          <strong>{{ periodEndLabel }}</strong>
          <span v-if="periodRangeHint" class="mp__end-range">{{ periodRangeHint }}</span>
        </div>
      </div>

      <div class="mp__block-row">
        <v-switch
          v-model="form.block_on_unpaid"
          color="error"
          density="compact"
          hide-details
          inset
          :disabled="loading || saving"
          class="mp__switch"
        >
          <template #label>
            <span class="mp__switch-label">Bloquear rutinas si no paga</span>
          </template>
        </v-switch>
      </div>

      <button
        type="button"
        class="mp__notes-toggle"
        :disabled="loading || saving"
        @click="notesOpen = !notesOpen"
      >
        <v-icon
          :icon="notesOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="16"
        />
        Notas internas
        <span v-if="form.notes && !notesOpen" class="mp__notes-dot" />
      </button>

      <v-textarea
        v-if="notesOpen"
        v-model="form.notes"
        placeholder="Solo visibles para ti"
        density="compact"
        variant="outlined"
        rows="2"
        auto-grow
        hide-details
        :disabled="loading || saving"
      />
    </form>
  </section>
</template>

<style scoped>
.mp {
  padding: 0.65rem 0.75rem 0.7rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin-bottom: 0.55rem;
}

.mp__head-text {
  min-width: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
}

.mp__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
}

.mp__plan {
  font-size: 0.68rem;
  font-weight: 600;
  color: #8b929e;
}

.mp__form {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.mp__status-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.mp__label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b929e;
}

.mp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.mp__chip {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #c5cad3;
  border-radius: 999px;
  padding: 0.22rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.mp__chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mp__chip--on.mp__chip--active {
  border-color: rgba(0, 229, 255, 0.45);
  background: rgba(0, 229, 255, 0.16);
  color: #00e5ff;
}

.mp__chip--on.mp__chip--owing {
  border-color: rgba(255, 176, 32, 0.45);
  background: rgba(255, 176, 32, 0.16);
  color: #ffb020;
}

.mp__chip--on.mp__chip--expired {
  border-color: rgba(255, 92, 92, 0.45);
  background: rgba(255, 92, 92, 0.14);
  color: #ff8a80;
}

.mp__period {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 0.5rem;
  align-items: stretch;
}

.mp__date :deep(.v-field) {
  min-height: 40px !important;
}

.mp__end {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.08rem;
  padding: 0.4rem 0.55rem;
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.16);
  min-width: 0;
}

.mp__end-kicker {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00e5ff;
}

.mp__end strong {
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.mp__end-range {
  font-size: 0.65rem;
  font-weight: 600;
  color: #8b929e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp__block-row {
  margin-top: -0.1rem;
}

.mp__switch {
  margin-inline-start: 0;
}

.mp__switch-label {
  font-size: 0.78rem;
  line-height: 1.25;
  color: #e8eaed;
}

.mp__notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  align-self: flex-start;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8b929e;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.mp__notes-toggle:hover {
  color: #c5cad3;
}

.mp__notes-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e5ff;
}

@media (max-width: 520px) {
  .mp__period {
    grid-template-columns: 1fr;
  }
}
</style>
