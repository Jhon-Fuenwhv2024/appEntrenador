<script setup>
/**
 * Feature 091 — Editar los días de la semana 1 de un mesociclo y propagar al resto.
 */
import { computed, reactive, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getTemplates } from '../api/templatesApi.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  phase: { type: Object, default: null },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'submit', 'notify']);

let rowUid = 0;
const makeRow = (dia, templateId = null) => ({
  uid: (rowUid += 1),
  dia_semana: dia,
  template_id: templateId,
});

const templates = shallowRef([]);
const loading = shallowRef(false);
const state = reactive({ rows: [makeRow('Lunes')] });

const templateItems = computed(() => (
  templates.value.map((item) => ({ title: item.name, value: item.id }))
));

const firstWeek = computed(() => props.phase?.weeks?.[0] ?? null);

const duplicatedDay = computed(() => {
  const seen = new Set();
  for (const row of state.rows) {
    if (seen.has(row.dia_semana)) return row.dia_semana;
    seen.add(row.dia_semana);
  }
  return null;
});

const filledRows = computed(() => state.rows.filter((row) => row.template_id));

const canSubmit = computed(() => (
  Boolean(firstWeek.value) && filledRows.value.length > 0 && !duplicatedDay.value
));

function seedRowsFromPhase() {
  const days = firstWeek.value?.days ?? [];
  const rows = days.length
    ? days.map((day) => makeRow(day.dia_semana))
    : [makeRow('Lunes'), makeRow('Miércoles'), makeRow('Viernes')];
  state.rows.splice(0, state.rows.length, ...rows);
}

async function loadTemplates() {
  try {
    loading.value = true;
    const response = await getTemplates();
    templates.value = response.data?.data ?? [];
  } catch (error) {
    templates.value = [];
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudieron cargar las plantillas'),
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    seedRowsFromPhase();
    loadTemplates();
  },
);

function addRow() {
  const used = new Set(state.rows.map((row) => row.dia_semana));
  const next = DAYS.find((day) => !used.has(day)) || 'Lunes';
  state.rows.push(makeRow(next));
}

function removeRow(uid) {
  if (state.rows.length <= 1) return;
  const index = state.rows.findIndex((row) => row.uid === uid);
  if (index >= 0) state.rows.splice(index, 1);
}

function close() {
  if (props.saving) return;
  emit('update:modelValue', false);
}

function handleSubmit() {
  if (!canSubmit.value) return;
  emit('submit', {
    weekId: firstWeek.value.id,
    days: filledRows.value.map((row) => ({
      dia_semana: row.dia_semana,
      template_id: Number(row.template_id),
    })),
  });
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    scrollable
    scrim="rgba(0, 0, 0, 0.62)"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pwd" bg-color="surface" rounded="xl">
      <v-card-item class="pwd__head">
        <template #prepend>
          <div class="pwd__head-icon" aria-hidden="true">
            <v-icon icon="mdi-view-week-outline" size="22" color="primary" />
          </div>
        </template>
        <v-card-title class="pwd__title">Semana base</v-card-title>
        <v-card-subtitle class="pwd__subtitle">
          {{ phase?.name || 'Mesociclo' }} · se copia al resto de microciclos
        </v-card-subtitle>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            :disabled="saving"
            @click="close"
          />
        </template>
      </v-card-item>

      <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

      <v-card-text class="pwd__body">
        <p v-if="!templates.length && !loading" class="pwd__warn" role="alert">
          <v-icon icon="mdi-alert-outline" size="16" aria-hidden="true" />
          No tienes plantillas todavía. Créalas en la pestaña Plantillas.
        </p>

        <div
          v-for="row in state.rows"
          :key="row.uid"
          class="pwd__row"
        >
          <v-select
            v-model="row.dia_semana"
            :items="DAYS"
            label="Día"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="saving"
          />
          <v-select
            v-model="row.template_id"
            :items="templateItems"
            label="Plantilla"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details="auto"
            class="pwd__row-template"
            :disabled="saving || !templates.length"
          />
          <button
            type="button"
            class="pwd__row-remove"
            aria-label="Quitar día"
            :disabled="saving || state.rows.length <= 1"
            @click="removeRow(row.uid)"
          >
            <v-icon icon="mdi-close" size="18" />
          </button>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          class="mt-1"
          :disabled="saving"
          @click="addRow"
        >
          Añadir día
        </v-btn>

        <p v-if="duplicatedDay" class="pwd__warn mt-3" role="alert">
          <v-icon icon="mdi-alert-outline" size="16" aria-hidden="true" />
          {{ duplicatedDay }} está repetido.
        </p>
      </v-card-text>

      <v-card-actions class="pwd__actions">
        <v-btn variant="outlined" class="pwd__btn" :disabled="saving" @click="close">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="pwd__btn font-weight-bold"
          :loading="saving"
          :disabled="!canSubmit || saving"
          @click="handleSubmit"
        >
          Guardar y propagar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pwd {
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pwd__head {
  padding-top: 1rem !important;
  padding-bottom: 0.35rem !important;
}

.pwd__head-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.pwd__title {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  color: var(--tf-on-surface, #fff);
}

.pwd__subtitle {
  white-space: normal !important;
  opacity: 1 !important;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
  font-size: 0.78rem !important;
}

.pwd__body {
  padding-top: 0.75rem !important;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.pwd__row {
  display: grid;
  grid-template-columns: minmax(7rem, 1fr) minmax(9rem, 1.6fr) 44px;
  gap: 0.5rem;
  align-items: start;
}

.pwd__row-remove {
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

.pwd__row-remove:hover:not(:disabled) {
  background: rgba(255, 82, 82, 0.16);
}

.pwd__row-remove:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.pwd__row-remove:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pwd__warn {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  font-size: 0.78rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 82, 82, 0.08);
  border: 1px solid rgba(255, 82, 82, 0.35);
}

.pwd__actions {
  display: flex !important;
  gap: 0.65rem;
  padding: 0.75rem 1.25rem 1.25rem !important;
}

.pwd__btn {
  flex: 1;
  min-height: 44px;
}

.pwd :deep(.v-field--variant-outlined) {
  background: transparent;
}

.pwd :deep(.v-label.v-field-label--floating) {
  font-size: 0.75rem !important;
  font-weight: 600;
  padding-inline: 0.2rem;
  background-color: rgb(var(--v-theme-surface)) !important;
}

@media (max-width: 480px) {
  .pwd__row {
    grid-template-columns: 1fr 44px;
  }

  .pwd__row-template {
    grid-column: 1 / -1;
    order: 3;
  }
}
</style>
