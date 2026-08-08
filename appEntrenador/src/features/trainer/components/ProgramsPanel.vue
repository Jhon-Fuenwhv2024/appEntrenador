<script setup>
/**
 * Feature 091 — Programas de periodización (Recursos → Programas).
 * Lista + wizard + semana base + asignación.
 */
import { computed, onMounted, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  addProgramPhase,
  assignProgram,
  createProgram,
  deleteProgram,
  getProgramById,
  getPrograms,
  propagatePhase,
  upsertWeekDays,
} from '../api/programsApi.js';
import AssignProgramDialog from './AssignProgramDialog.vue';
import ProgramWeekDaysDialog from './ProgramWeekDaysDialog.vue';
import ProgramWizardDialog from './ProgramWizardDialog.vue';

const PHASE_LABEL = {
  hypertrophy: 'Hipertrofia',
  strength: 'Fuerza',
  power: 'Potencia',
  deload: 'Descarga',
  peak: 'Pico',
  conditioning: 'Acondicionamiento',
  custom: 'Personalizado',
};

const emit = defineEmits(['notify']);

const programs = shallowRef([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const expandedId = shallowRef(null);
const expandedDetail = shallowRef(null);
const loadingDetail = shallowRef(false);

const wizardOpen = shallowRef(false);
const assignOpen = shallowRef(false);
const weekDaysOpen = shallowRef(false);
const activeProgram = shallowRef(null);
const activePhase = shallowRef(null);

const expandedPhases = computed(() => expandedDetail.value?.phases ?? []);

function notify(text, color = 'success') {
  emit('notify', { text, color });
}

function onChildNotify(payload) {
  emit('notify', payload);
}

async function loadPrograms() {
  try {
    loading.value = true;
    const response = await getPrograms();
    programs.value = response.data?.success ? (response.data.data ?? []) : [];
  } catch (error) {
    programs.value = [];
    notify(getApiErrorMessage(error, 'No se pudieron cargar los programas'), 'error');
  } finally {
    loading.value = false;
  }
}

async function fetchDetail(programId) {
  const response = await getProgramById(programId);
  if (!response.data?.success) {
    throw new Error(response.data?.error || 'No se pudo cargar el programa');
  }
  return response.data.data;
}

async function toggleDetail(program) {
  if (expandedId.value === program.id) {
    expandedId.value = null;
    expandedDetail.value = null;
    return;
  }

  expandedId.value = program.id;
  expandedDetail.value = null;
  try {
    loadingDetail.value = true;
    expandedDetail.value = await fetchDetail(program.id);
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo cargar el detalle'), 'error');
    expandedId.value = null;
  } finally {
    loadingDetail.value = false;
  }
}

async function openAssign(program) {
  try {
    saving.value = true;
    activeProgram.value = await fetchDetail(program.id);
    assignOpen.value = true;
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo abrir la asignación'), 'error');
  } finally {
    saving.value = false;
  }
}

function openWeekDays(program, phase) {
  activeProgram.value = program;
  activePhase.value = phase;
  weekDaysOpen.value = true;
}

async function handleWizardSubmit(payload) {
  try {
    saving.value = true;
    const created = await createProgram(payload.program);
    if (!created.data?.success) {
      notify(created.data?.error || 'No se pudo crear el programa', 'error');
      return;
    }
    await addProgramPhase(created.data.data.id, payload.phase);
    wizardOpen.value = false;
    notify(
      payload.phase.seed_days.length
        ? 'Programa creado con su primer mesociclo'
        : 'Estructura creada. Añade la semana base para poder asignarlo.',
    );
    await loadPrograms();
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo crear el programa'), 'error');
  } finally {
    saving.value = false;
  }
}

async function handleWeekDaysSubmit(payload) {
  const program = activeProgram.value;
  const phase = activePhase.value;
  if (!program?.id || !phase?.id) return;

  try {
    saving.value = true;
    await upsertWeekDays(program.id, payload.weekId, { days: payload.days });
    if ((phase.duration_weeks || 1) > 1) {
      await propagatePhase(program.id, phase.id);
    }
    weekDaysOpen.value = false;
    notify('Semana base guardada y propagada');
    if (expandedId.value === program.id) {
      expandedDetail.value = await fetchDetail(program.id);
    }
    await loadPrograms();
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo guardar la semana base'), 'error');
  } finally {
    saving.value = false;
  }
}

async function handleAssignSubmit(payload) {
  const program = activeProgram.value;
  if (!program?.id) return;

  try {
    saving.value = true;
    await assignProgram(program.id, payload);
    assignOpen.value = false;
    notify('Programa asignado · semana 1 activa en el alumno');
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo asignar el programa'), 'error');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(program) {
  if (!program?.id) return;
  const confirmed = window.confirm(
    `¿Eliminar "${program.name}"? Las rutinas ya asignadas al alumno se conservan.`,
  );
  if (!confirmed) return;

  try {
    await deleteProgram(program.id);
    if (expandedId.value === program.id) {
      expandedId.value = null;
      expandedDetail.value = null;
    }
    notify('Programa eliminado');
    await loadPrograms();
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo eliminar el programa'), 'error');
  }
}

function weekSummary(week) {
  const days = week.days ?? [];
  if (!days.length) return 'Sin días';
  return days.map((day) => day.dia_semana.slice(0, 3)).join(' · ');
}

onMounted(loadPrograms);
</script>

<template>
  <div class="pp">
    <div class="pp__toolbar">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="font-weight-bold"
        @click="wizardOpen = true"
      >
        Nuevo programa
      </v-btn>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="loadPrograms"
      >
        Actualizar
      </v-btn>
    </div>

    <div class="pp__legend" role="note">
      <v-icon icon="mdi-chart-timeline-variant" size="18" color="primary" aria-hidden="true" />
      <p class="pp__legend-text">
        <strong>Macrociclo</strong> (plan largo) →
        <strong>mesociclo</strong> (fase de 3–6 semanas) →
        <strong>microciclo</strong> (la semana) → sesiones del día.
        Al asignar solo se activa la semana en curso.
      </p>
    </div>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      height="2"
      class="mb-3"
    />

    <ul v-else-if="programs.length" class="pp__list" aria-label="Programas de periodización">
      <li
        v-for="program in programs"
        :key="program.id"
        class="pp__card"
      >
        <div class="pp__card-top">
          <div class="pp__avatar" aria-hidden="true">
            <v-icon icon="mdi-calendar-star" size="20" color="primary" />
          </div>

          <div class="pp__main">
            <p class="pp__name">{{ program.name }}</p>
            <p class="pp__meta">
              <span class="pp__badge">{{ program.phases_count }} mesociclo(s)</span>
              <span v-if="program.planned_weeks">~{{ program.planned_weeks }} sem.</span>
              <span v-if="program.goal" class="pp__goal">{{ program.goal }}</span>
            </p>
          </div>

          <div class="pp__actions">
            <button
              type="button"
              class="pp__icon-btn"
              :aria-label="expandedId === program.id ? 'Ocultar detalle' : 'Ver detalle'"
              :aria-expanded="expandedId === program.id"
              @click="toggleDetail(program)"
            >
              <v-icon
                :icon="expandedId === program.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="18"
              />
            </button>
            <button
              type="button"
              class="pp__icon-btn pp__icon-btn--danger"
              aria-label="Eliminar programa"
              @click="handleDelete(program)"
            >
              <v-icon icon="mdi-delete-outline" size="18" />
            </button>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              class="font-weight-bold"
              :disabled="saving"
              @click="openAssign(program)"
            >
              Asignar
            </v-btn>
          </div>
        </div>

        <div v-if="expandedId === program.id" class="pp__detail">
          <v-progress-circular
            v-if="loadingDetail"
            indeterminate
            color="primary"
            size="22"
            width="2"
          />

          <template v-else-if="expandedPhases.length">
            <div
              v-for="phase in expandedPhases"
              :key="phase.id"
              class="pp__phase"
            >
              <div class="pp__phase-head">
                <span class="pp__phase-name">{{ phase.name }}</span>
                <span class="pp__phase-tag">
                  {{ PHASE_LABEL[phase.phase_type] || phase.phase_type }}
                </span>
                <span class="pp__phase-weeks">{{ phase.duration_weeks }} microciclos</span>
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  prepend-icon="mdi-pencil-outline"
                  :disabled="saving"
                  @click="openWeekDays(program, phase)"
                >
                  Semana base
                </v-btn>
              </div>

              <ul class="pp__weeks">
                <li
                  v-for="week in phase.weeks"
                  :key="week.id"
                  class="pp__week"
                  :class="{ 'pp__week--empty': !week.days?.length }"
                >
                  <span class="pp__week-index">S{{ week.week_index }}</span>
                  <span class="pp__week-days">{{ weekSummary(week) }}</span>
                </li>
              </ul>
            </div>
          </template>

          <p v-else class="pp__detail-empty">
            Este programa aún no tiene mesociclos.
          </p>
        </div>
      </li>
    </ul>

    <div v-else class="pp__empty" role="status">
      <div class="pp__empty-icon" aria-hidden="true">
        <v-icon icon="mdi-chart-timeline-variant" size="28" color="primary" />
      </div>
      <p class="pp__empty-title">Sin programas todavía</p>
      <p class="pp__empty-text">
        Crea un macrociclo, elige una fase (hipertrofia, fuerza, descarga…) y monta la
        semana base con tus plantillas.
      </p>
      <v-btn
        color="primary"
        variant="tonal"
        class="mt-3 font-weight-bold"
        prepend-icon="mdi-plus"
        @click="wizardOpen = true"
      >
        Crear primer programa
      </v-btn>
    </div>

    <ProgramWizardDialog
      v-model="wizardOpen"
      :saving="saving"
      @submit="handleWizardSubmit"
      @notify="onChildNotify"
    />

    <ProgramWeekDaysDialog
      v-model="weekDaysOpen"
      :phase="activePhase"
      :saving="saving"
      @submit="handleWeekDaysSubmit"
      @notify="onChildNotify"
    />

    <AssignProgramDialog
      v-model="assignOpen"
      :program="activeProgram"
      :saving="saving"
      @submit="handleAssignSubmit"
      @notify="onChildNotify"
    />
  </div>
</template>

<style scoped>
.pp__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.pp__legend {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  margin-bottom: 1rem;
  border-radius: 14px;
  border: 1px solid rgba(0, 229, 255, 0.18);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.08), transparent 60%),
    rgba(255, 255, 255, 0.02);
}

.pp__legend-text {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pp__legend-text strong {
  color: var(--tf-on-surface, #fff);
}

.pp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.pp__card {
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.04), transparent 42%),
    rgba(255, 255, 255, 0.03);
}

.pp__card-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pp__avatar {
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

.pp__main {
  min-width: 0;
  flex: 1;
}

.pp__name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.pp__meta {
  margin: 0.25rem 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pp__badge {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(0, 229, 255, 0.14);
  color: #00e5ff;
}

.pp__goal {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 22ch;
}

.pp__actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.pp__icon-btn {
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

.pp__icon-btn:hover {
  background: rgba(0, 229, 255, 0.12);
}

.pp__icon-btn--danger:hover {
  background: rgba(255, 82, 82, 0.16);
}

.pp__icon-btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.pp__detail {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pp__phase {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.pp__phase-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.pp__phase-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.pp__phase-tag {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tf-on-surface, #e8eaed);
}

.pp__phase-weeks {
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pp__weeks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pp__week {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pp__week--empty {
  border-style: dashed;
  opacity: 0.75;
}

.pp__week-index {
  font-weight: 700;
  color: #00e5ff;
}

.pp__detail-empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pp__empty {
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

.pp__empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.pp__empty-title {
  margin: 0.65rem 0 0;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.pp__empty-text {
  margin: 0;
  max-width: 36ch;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

@media (max-width: 560px) {
  .pp__card-top {
    flex-wrap: wrap;
  }

  .pp__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .pp__goal {
    max-width: 100%;
  }
}
</style>
