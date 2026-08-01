<script setup>
/**
 * CRUD de tipos de membresía del trainer (Feature 079).
 * Panel en hub Recursos → Membresías.
 */
import { computed, onMounted, reactive, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { formatMoneyCop } from '../../../shared/membership/money.js';
import {
  createMembershipType,
  deleteMembershipType,
  listMembershipTypes,
  updateMembershipType,
} from '../api/membershipTypesApi.js';

const emit = defineEmits(['notify']);

const DURATION_PRESETS = [
  { days: 7, label: '7 d' },
  { days: 15, label: '15 d' },
  { days: 30, label: '1 mes' },
  { days: 90, label: '3 meses' },
  { days: 180, label: '6 meses' },
  { days: 365, label: '1 año' },
];

const types = shallowRef([]);
const loading = shallowRef(false);
const saving = shallowRef(false);
const formOpen = shallowRef(false);
const editing = shallowRef(null);

const form = reactive({
  name: '',
  price: '',
  duration_days: 30,
});

const dialogTitle = computed(() => (
  editing.value ? 'Editar tipo' : 'Nuevo tipo de membresía'
));

const dialogSubtitle = computed(() => (
  editing.value
    ? 'Los cambios no afectan el precio ya congelado en alumnos existentes.'
    : 'Define el plan que cobras. Al asignarlo, el precio se congela en la ficha del alumno.'
));

const previewName = computed(() => {
  const name = String(form.name || '').trim();
  return name || 'Nombre del plan';
});

const previewPrice = computed(() => {
  const n = Number(form.price);
  if (!Number.isFinite(n) || n < 0 || form.price === '') return 'Precio —';
  return formatMoneyCop(n);
});

const previewDuration = computed(() => {
  const n = Number(form.duration_days);
  if (!Number.isInteger(n) || n < 1) return 'Duración —';
  if (n === 30) return '30 días · 1 mes';
  if (n === 90) return '90 días · 3 meses';
  if (n === 180) return '180 días · 6 meses';
  if (n === 365) return '365 días · 1 año';
  return `${n} días`;
});

function resetForm() {
  form.name = '';
  form.price = '';
  form.duration_days = 30;
  editing.value = null;
}

function openCreate() {
  resetForm();
  formOpen.value = true;
}

function openEdit(item) {
  editing.value = item;
  form.name = item.name || '';
  form.price = item.price != null ? String(item.price) : '';
  form.duration_days = item.duration_days || 30;
  formOpen.value = true;
}

function closeForm() {
  if (saving.value) return;
  formOpen.value = false;
}

function applyDurationPreset(days) {
  form.duration_days = days;
}

async function loadTypes() {
  try {
    loading.value = true;
    const response = await listMembershipTypes(true);
    types.value = response.data?.data ?? [];
  } catch (error) {
    console.error('Error cargando tipos de membresía:', error);
    types.value = [];
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudieron cargar los tipos'),
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  const name = String(form.name || '').trim();
  if (!name) {
    emit('notify', { text: 'Indica un nombre', color: 'warning' });
    return;
  }
  const price = Number(form.price);
  if (!Number.isFinite(price) || price < 0) {
    emit('notify', { text: 'Indica un precio válido (≥ 0)', color: 'warning' });
    return;
  }
  const duration = Number(form.duration_days);
  if (!Number.isInteger(duration) || duration < 1) {
    emit('notify', { text: 'La duración debe ser al menos 1 día', color: 'warning' });
    return;
  }

  const payload = {
    name,
    price,
    duration_days: duration,
    is_active: true,
  };

  try {
    saving.value = true;
    if (editing.value?.id) {
      await updateMembershipType(editing.value.id, payload);
      emit('notify', { text: 'Tipo actualizado', color: 'success' });
    } else {
      await createMembershipType(payload);
      emit('notify', { text: 'Tipo creado', color: 'success' });
    }
    formOpen.value = false;
    resetForm();
    await loadTypes();
  } catch (error) {
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo guardar el tipo'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

async function onArchive(item) {
  if (!item?.id) return;
  const label = item.is_active ? 'archivar' : 'reactivar';
  if (!window.confirm(`¿${label.charAt(0).toUpperCase() + label.slice(1)} "${item.name}"?`)) {
    return;
  }

  try {
    if (item.is_active) {
      await deleteMembershipType(item.id);
      emit('notify', { text: 'Tipo archivado o eliminado', color: 'success' });
    } else {
      await updateMembershipType(item.id, { is_active: true });
      emit('notify', { text: 'Tipo reactivado', color: 'success' });
    }
    await loadTypes();
  } catch (error) {
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo actualizar el tipo'),
      color: 'error',
    });
  }
}

onMounted(loadTypes);
</script>

<template>
  <div class="mtp">
    <div class="mtp__toolbar">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="font-weight-bold"
        @click="openCreate"
      >
        Nuevo tipo
      </v-btn>
    </div>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      height="2"
      class="mb-3"
    />

    <ul
      v-else-if="types.length"
      class="mtp__list"
      aria-label="Tipos de membresía"
    >
      <li
        v-for="item in types"
        :key="item.id"
        class="mtp__card"
        :class="{ 'mtp__card--off': !item.is_active }"
      >
        <div
          class="mtp__avatar"
          aria-hidden="true"
        >
          <v-icon
            icon="mdi-card-account-details-outline"
            size="20"
            color="primary"
          />
        </div>
        <div class="mtp__main">
          <p class="mtp__name">{{ item.name }}</p>
          <p class="mtp__meta">
            <span class="mtp__price">{{ formatMoneyCop(item.price) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ item.duration_days }} días</span>
            <span
              v-if="!item.is_active"
              class="mtp__badge"
            >Archivado</span>
          </p>
        </div>
        <div class="mtp__actions">
          <button
            type="button"
            class="mtp__icon-btn"
            aria-label="Editar tipo"
            @click="openEdit(item)"
          >
            <v-icon icon="mdi-pencil-outline" size="18" />
          </button>
          <button
            type="button"
            class="mtp__icon-btn"
            :aria-label="item.is_active ? 'Archivar tipo' : 'Reactivar tipo'"
            @click="onArchive(item)"
          >
            <v-icon
              :icon="item.is_active ? 'mdi-archive-outline' : 'mdi-restore'"
              size="18"
            />
          </button>
        </div>
      </li>
    </ul>

    <div
      v-else
      class="mtp__empty"
      role="status"
    >
      <div
        class="mtp__empty-icon"
        aria-hidden="true"
      >
        <v-icon
          icon="mdi-card-account-details-outline"
          size="28"
          color="primary"
        />
      </div>
      <p class="mtp__empty-title">Sin tipos todavía</p>
      <p class="mtp__empty-text">
        Crea planes como “Mensual” o “Trimestral” con el precio que cobras.
      </p>
      <v-btn
        color="primary"
        variant="tonal"
        class="mt-3 font-weight-bold"
        prepend-icon="mdi-plus"
        @click="openCreate"
      >
        Crear primer tipo
      </v-btn>
    </div>

    <v-dialog
      v-model="formOpen"
      max-width="480"
      scrim="rgba(0, 0, 0, 0.62)"
      transition="dialog-bottom-transition"
    >
      <v-card
        class="mtp-dialog"
        bg-color="surface"
        rounded="xl"
      >
        <v-card-item class="mtp-dialog__head">
          <template #prepend>
            <div
              class="mtp-dialog__icon"
              aria-hidden="true"
            >
              <v-icon
                icon="mdi-card-account-details-outline"
                size="22"
                color="primary"
              />
            </div>
          </template>
          <v-card-title class="mtp-dialog__title">
            {{ dialogTitle }}
          </v-card-title>
          <v-card-subtitle class="mtp-dialog__subtitle">
            {{ dialogSubtitle }}
          </v-card-subtitle>
          <template #append>
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              aria-label="Cerrar"
              :disabled="saving"
              @click="closeForm"
            />
          </template>
        </v-card-item>

        <v-card-text class="mtp-dialog__body">
          <div
            class="mtp-preview"
            aria-live="polite"
          >
            <div class="mtp-preview__top">
              <p class="mtp-preview__name">{{ previewName }}</p>
              <span class="mtp-preview__chip">Plan</span>
            </div>
            <div class="mtp-preview__row">
              <span class="mtp-preview__price">{{ previewPrice }}</span>
              <span
                class="mtp-preview__dot"
                aria-hidden="true"
              >·</span>
              <span class="mtp-preview__duration">{{ previewDuration }}</span>
            </div>
          </div>

          <v-text-field
            v-model="form.name"
            label="Nombre del plan"
            placeholder="Ej. Mensual, Trimestral…"
            prepend-inner-icon="mdi-tag-outline"
            density="comfortable"
            variant="outlined"
            color="primary"
            hide-details="auto"
            class="mtp-field mb-3"
            autocomplete="off"
            :disabled="saving"
          />

          <div class="mtp-fields-row">
            <v-text-field
              v-model="form.price"
              label="Precio"
              type="number"
              min="0"
              step="1000"
              suffix="COP"
              density="comfortable"
              variant="outlined"
              color="primary"
              hide-details="auto"
              hint="Se congela al asignar al alumno"
              persistent-hint
              class="mtp-field"
              :disabled="saving"
            />

            <v-text-field
              v-model.number="form.duration_days"
              label="Duración"
              type="number"
              min="1"
              max="3660"
              suffix="días"
              density="comfortable"
              variant="outlined"
              color="primary"
              hide-details="auto"
              class="mtp-field"
              :disabled="saving"
            />
          </div>

          <p class="mtp-dialog__presets-label">
            Duración rápida
          </p>
          <div
            class="mtp-presets"
            role="group"
            aria-label="Duraciones frecuentes"
          >
            <button
              v-for="preset in DURATION_PRESETS"
              :key="preset.days"
              type="button"
              class="mtp-presets__btn"
              :class="{ 'mtp-presets__btn--on': Number(form.duration_days) === preset.days }"
              :disabled="saving"
              :aria-pressed="Number(form.duration_days) === preset.days"
              @click="applyDurationPreset(preset.days)"
            >
              {{ preset.label }}
            </button>
          </div>
        </v-card-text>

        <v-card-actions class="mtp-dialog__actions">
          <v-btn
            variant="outlined"
            class="mtp-dialog__cancel"
            :disabled="saving"
            @click="closeForm"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="mtp-dialog__save font-weight-bold"
            :loading="saving"
            @click="onSave"
          >
            {{ editing ? 'Guardar cambios' : 'Crear tipo' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.mtp__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.mtp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.mtp__card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.04), transparent 42%),
    rgba(255, 255, 255, 0.03);
}

.mtp__card--off {
  opacity: 0.72;
}

.mtp__avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.mtp__main {
  min-width: 0;
  flex: 1;
}

.mtp__name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.mtp__meta {
  margin: 0.25rem 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.mtp__price {
  color: var(--tf-on-surface, #e8eaed);
  font-weight: 600;
}

.mtp__badge {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.08);
}

.mtp__actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.mtp__icon-btn {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--tf-on-surface, #e8eaed);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mtp__icon-btn:hover {
  background: rgba(0, 229, 255, 0.12);
}

.mtp__icon-btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.mtp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.25rem 1rem;
  gap: 0.35rem;
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.mtp__empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.mtp__empty-title {
  margin: 0.65rem 0 0;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.mtp__empty-text {
  margin: 0;
  max-width: 30ch;
  font-size: 0.8125rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.45;
}

.mtp-dialog {
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.mtp-dialog__head {
  padding-top: 1rem !important;
  padding-bottom: 0.35rem !important;
}

.mtp-dialog__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.mtp-dialog__title {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  color: var(--tf-on-surface, #fff);
}

.mtp-dialog__subtitle {
  white-space: normal !important;
  opacity: 1 !important;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
  font-size: 0.78rem !important;
  line-height: 1.4 !important;
  max-width: 34ch;
}

.mtp-dialog__body {
  padding-top: 0.75rem !important;
}

.mtp-fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  align-items: start;
}

.mtp-field {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Evita que el outline “tache” el label flotante (notch Vuetify). */
.mtp-dialog :deep(.v-field--variant-outlined) {
  background: transparent;
}

.mtp-dialog :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 0.28;
}

.mtp-dialog :deep(.v-label.v-field-label--floating) {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 0.75rem !important;
  font-weight: 600;
  letter-spacing: -0.01em;
  padding-inline: 0.2rem;
  background-color: rgb(var(--v-theme-surface)) !important;
}

.mtp-dialog :deep(.v-field__input),
.mtp-dialog :deep(.v-text-field__prefix),
.mtp-dialog :deep(.v-text-field__suffix) {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.mtp-dialog :deep(.v-text-field__prefix),
.mtp-dialog :deep(.v-text-field__suffix) {
  opacity: 1;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.8125rem;
  font-weight: 600;
}

@media (max-width: 420px) {
  .mtp-fields-row {
    grid-template-columns: 1fr;
  }
}

.mtp-preview {
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(0, 229, 255, 0.18);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.1), transparent 55%),
    rgba(255, 255, 255, 0.03);
}

.mtp-preview__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.mtp-preview__name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mtp-preview__chip {
  flex-shrink: 0;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #0b0d12;
  background: #00e5ff;
}

.mtp-preview__row {
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.mtp-preview__price {
  font-weight: 700;
  color: var(--tf-on-surface, #e8eaed);
}

.mtp-dialog__presets-label {
  margin: 0.85rem 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.mtp-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.mtp-presets__btn {
  min-height: 36px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.mtp-presets__btn:hover:not(:disabled) {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.08);
}

.mtp-presets__btn--on {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.16);
  color: #00e5ff;
}

.mtp-presets__btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.mtp-presets__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mtp-dialog__actions {
  display: flex !important;
  gap: 0.65rem;
  padding: 0.75rem 1.25rem 1.25rem !important;
}

.mtp-dialog__cancel,
.mtp-dialog__save {
  flex: 1;
  min-height: 44px;
}

@media (max-width: 390px) {
  .mtp-dialog__subtitle {
    max-width: 100%;
  }
}
</style>
