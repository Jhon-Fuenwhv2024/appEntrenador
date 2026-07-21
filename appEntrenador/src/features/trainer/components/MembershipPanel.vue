<script setup>
/**
 * Mini status card de membresía (040 + 060). Vista densa; edición bajo demanda.
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

const STATUS_LABEL = {
  active: 'Al día',
  owing: 'Pendiente',
  expired: 'Vencido',
};

const loading = shallowRef(false);
const saving = shallowRef(false);
const loadError = shallowRef('');
const notesOpen = shallowRef(false);
const editing = shallowRef(false);
const hasMembership = shallowRef(false);
const savedSnapshot = shallowRef(null);

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

const statusTitle = computed(() => STATUS_LABEL[form.status] || form.status || '—');

const expiresShort = computed(() => {
  if (!computedPeriodEnd.value) return '—';
  return `Vence ${periodEndLabel.value}`;
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

function snapshotFromForm() {
  return {
    status: form.status,
    period_start: form.period_start,
    period_end: form.period_end,
    notes: form.notes,
    block_on_unpaid: form.block_on_unpaid,
    hasMembership: hasMembership.value,
  };
}

function applyMembership(data) {
  if (!data) {
    hasMembership.value = false;
    resetForm();
    savedSnapshot.value = null;
    return;
  }
  hasMembership.value = true;
  form.status = data.status || 'active';
  form.period_start = data.period_start
    ? String(data.period_start).slice(0, 10)
    : todayDateOnly();
  form.period_end = data.period_end ? String(data.period_end).slice(0, 10) : '';
  form.notes = data.notes || '';
  form.block_on_unpaid = Boolean(data.block_on_unpaid);
  notesOpen.value = Boolean(form.notes);
  savedSnapshot.value = snapshotFromForm();
}

function restoreSnapshot() {
  const snap = savedSnapshot.value;
  if (!snap) {
    hasMembership.value = false;
    resetForm();
    return;
  }
  hasMembership.value = Boolean(snap.hasMembership);
  form.status = snap.status;
  form.period_start = snap.period_start;
  form.period_end = snap.period_end;
  form.notes = snap.notes;
  form.block_on_unpaid = Boolean(snap.block_on_unpaid);
  notesOpen.value = Boolean(form.notes);
}

async function loadMembership() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    editing.value = false;
    const response = await getClientMembership(props.clientId);
    applyMembership(response.data?.data ?? null);
  } catch (error) {
    console.error('Error cargando membresía:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar la membresía');
    hasMembership.value = false;
    resetForm();
  } finally {
    loading.value = false;
  }
}

function startEdit() {
  if (!hasMembership.value) {
    resetForm();
  }
  editing.value = true;
  notesOpen.value = Boolean(form.notes);
}

function cancelEdit() {
  restoreSnapshot();
  editing.value = false;
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
    editing.value = false;
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
  <section
    class="mp"
    :class="{ 'mp--editing': editing }"
    aria-labelledby="mp-title"
  >
    <!-- Vista compacta -->
    <template v-if="!editing">
      <div class="mp__mini">
        <div class="mp__mini-left">
          <v-icon icon="mdi-card-account-details-outline" size="16" class="mp__ico" />
          <div class="mp__mini-copy">
            <div class="mp__mini-top">
              <h3 id="mp-title" class="mp__title">Membresía</h3>
              <span
                v-if="hasMembership && !loading && !loadError"
                class="mp__dot"
                :class="`mp__dot--${form.status}`"
                :title="statusTitle"
              />
            </div>
            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
              height="2"
              class="mp__loader"
            />
            <p v-else-if="loadError" class="mp__err">{{ loadError }}</p>
            <template v-else-if="hasMembership">
              <p class="mp__line">
                <span class="mp__status" :class="`mp__status--${form.status}`">
                  {{ statusTitle }}
                </span>
                <span class="mp__sep">·</span>
                <span class="mp__expire">{{ expiresShort }}</span>
                <v-icon
                  v-if="form.block_on_unpaid"
                  icon="mdi-lock"
                  size="12"
                  class="mp__lock"
                  title="Bloqueo si no paga"
                />
              </p>
            </template>
            <p v-else class="mp__empty">Sin asignar</p>
          </div>
        </div>
        <button
          v-if="!loading && !loadError"
          type="button"
          class="mp__icon-btn"
          :aria-label="hasMembership ? 'Editar membresía' : 'Asignar membresía'"
          @click="startEdit"
        >
          <v-icon
            :icon="hasMembership ? 'mdi-pencil-outline' : 'mdi-plus'"
            size="16"
          />
        </button>
      </div>
    </template>

    <!-- Edición expandida -->
    <template v-else>
      <header class="mp__edit-head">
        <h3 id="mp-title" class="mp__title">Membresía</h3>
        <div class="mp__edit-actions">
          <v-btn
            variant="text"
            size="x-small"
            :disabled="saving"
            @click="cancelEdit"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            form="mp-form"
            color="primary"
            size="x-small"
            :loading="saving"
          >
            Guardar
          </v-btn>
        </div>
      </header>

      <form id="mp-form" class="mp__form" @submit.prevent="onSave">
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
            :disabled="saving"
            @click="form.status = opt.value"
          >
            {{ opt.title }}
          </button>
        </div>

        <div class="mp__period">
          <v-text-field
            v-model="form.period_start"
            type="date"
            label="Inicio"
            density="compact"
            variant="outlined"
            hide-details
            :disabled="saving"
            class="mp__date"
          />
          <div class="mp__end" :title="periodEndLabel">
            <span class="mp__end-kicker">Vence</span>
            <strong>{{ periodEndLabel }}</strong>
          </div>
        </div>

        <label class="mp__check">
          <input
            v-model="form.block_on_unpaid"
            type="checkbox"
            :disabled="saving"
          >
          Bloquear rutinas si no paga
        </label>

        <button
          type="button"
          class="mp__notes-toggle"
          :disabled="saving"
          @click="notesOpen = !notesOpen"
        >
          <v-icon
            :icon="notesOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="14"
          />
          Notas
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
          :disabled="saving"
        />
      </form>
    </template>
  </section>
</template>

<style scoped>
.mp {
  height: 100%;
  min-height: 0;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mp--editing {
  padding: 0.55rem 0.7rem 0.65rem;
}

.mp__mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  min-height: 2.5rem;
}

.mp__mini-left {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.mp__ico {
  flex-shrink: 0;
  margin-top: 0.12rem;
  color: #8b929e;
}

.mp__mini-copy {
  min-width: 0;
  flex: 1;
}

.mp__mini-top {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mp__title {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #8b929e;
}

.mp__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mp__dot--active { background: #00e5ff; }
.mp__dot--owing { background: #ffb020; }
.mp__dot--expired { background: #ff8a80; }

.mp__loader {
  margin-top: 0.35rem;
  max-width: 6rem;
}

.mp__line {
  margin: 0.12rem 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.3rem;
  font-size: 0.8rem;
  line-height: 1.25;
}

.mp__status {
  font-weight: 800;
}

.mp__status--active { color: #00e5ff; }
.mp__status--owing { color: #ffb020; }
.mp__status--expired { color: #ff8a80; }

.mp__sep {
  color: #5c6370;
}

.mp__expire {
  font-weight: 600;
  color: #c5cad3;
  font-variant-numeric: tabular-nums;
}

.mp__lock {
  color: #ff8a80;
}

.mp__empty {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #8b929e;
}

.mp__err {
  margin: 0.1rem 0 0;
  font-size: 0.7rem;
  color: #ff8a80;
}

.mp__icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #c5cad3;
  cursor: pointer;
}

.mp__icon-btn:hover {
  border-color: rgba(0, 229, 255, 0.35);
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.08);
}

.mp__edit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.mp__edit-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.mp__form {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.mp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.mp__chip {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #c5cad3;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
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
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.4rem;
}

.mp__date {
  flex: 0 0 auto;
  width: 9.75rem;
  max-width: 100%;
}

.mp__date :deep(.v-field) {
  min-height: 34px !important;
}

.mp__date :deep(.v-field__input) {
  min-height: 34px !important;
  font-size: 0.78rem;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.mp__end {
  flex: 0 0 auto;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.02rem;
  min-width: 4.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.14);
}

.mp__end-kicker {
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00e5ff;
  line-height: 1;
}

.mp__end strong {
  font-size: 0.78rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  white-space: nowrap;
}

.mp__check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #c5cad3;
  cursor: pointer;
  user-select: none;
}

.mp__check input {
  accent-color: #ff8a80;
}

.mp__notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  align-self: flex-start;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8b929e;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
}

.mp__notes-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #00e5ff;
}

@media (max-width: 420px) {
  .mp__date {
    width: 100%;
  }
}
</style>
