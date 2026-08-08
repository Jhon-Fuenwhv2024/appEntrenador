<script setup>
/**
 * Feature 091 — Wizard: Macrociclo → Mesociclo (preset) → Microciclo base.
 * Props down / events up: no muta estado del padre.
 */
import { computed, reactive, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getTemplates } from '../api/templatesApi.js';
import { getProgramPresets } from '../api/programsApi.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const STEPS = [
  { index: 1, label: 'Macrociclo', hint: 'El plan largo' },
  { index: 2, label: 'Mesociclo', hint: 'La fase (3–6 semanas)' },
  { index: 3, label: 'Microciclo', hint: 'La semana base' },
];

const PRESET_ICONS = {
  hypertrophy: 'mdi-arm-flex',
  strength: 'mdi-weight-lifter',
  power: 'mdi-lightning-bolt',
  deload: 'mdi-sleep',
  peak: 'mdi-trophy-outline',
  conditioning: 'mdi-heart-pulse',
  custom: 'mdi-tune-variant',
};

const RULE_LABEL = {
  hold: 'Carga estable',
  same: 'Igual cada semana',
  add_weight: 'Sube peso por semana',
  add_reps: 'Sube reps por semana',
  deload_pct: 'Baja carga (descarga)',
};

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'submit', 'notify']);

const router = useRouter();

let seedUid = 0;
const makeSeedRow = (dia) => ({ uid: (seedUid += 1), dia_semana: dia, template_id: null });

const step = shallowRef(1);
const presets = shallowRef([]);
const templates = shallowRef([]);
const loadingMeta = shallowRef(false);

const form = reactive({
  name: '',
  goal: '',
  planned_weeks: 12,
  preset: 'hypertrophy',
  phase_name: '',
  duration_weeks: 4,
  seed_days: [makeSeedRow('Lunes'), makeSeedRow('Miércoles'), makeSeedRow('Viernes')],
});

const selectedPreset = computed(() => (
  presets.value.find((item) => item.key === form.preset) || null
));

const templateItems = computed(() => (
  templates.value.map((item) => ({ title: item.name, value: item.id }))
));

const durationOptions = computed(() => {
  const min = selectedPreset.value?.min_weeks ?? 1;
  const max = selectedPreset.value?.max_weeks ?? 8;
  const out = [];
  for (let weeks = min; weeks <= max; weeks += 1) out.push(weeks);
  return out;
});

const filledDays = computed(() => form.seed_days.filter((row) => row.template_id));

const duplicatedDay = computed(() => {
  const seen = new Set();
  for (const row of form.seed_days) {
    if (seen.has(row.dia_semana)) return row.dia_semana;
    seen.add(row.dia_semana);
  }
  return null;
});

const canContinue = computed(() => {
  if (step.value === 1) return Boolean(form.name.trim());
  if (step.value === 2) return Boolean(form.preset) && Number(form.duration_weeks) > 0;
  return !duplicatedDay.value;
});

const submitLabel = computed(() => (
  filledDays.value.length ? 'Crear programa' : 'Crear solo la estructura'
));

const stepCaption = computed(() => (
  STEPS.find((item) => item.index === step.value)?.hint || ''
));

function resetForm() {
  step.value = 1;
  form.name = '';
  form.goal = '';
  form.planned_weeks = 12;
  form.preset = 'hypertrophy';
  form.phase_name = '';
  form.duration_weeks = 4;
  form.seed_days.splice(
    0,
    form.seed_days.length,
    makeSeedRow('Lunes'),
    makeSeedRow('Miércoles'),
    makeSeedRow('Viernes'),
  );
}

async function loadMeta() {
  try {
    loadingMeta.value = true;
    const [presetsRes, templatesRes] = await Promise.all([
      getProgramPresets(),
      getTemplates(),
    ]);
    presets.value = presetsRes.data?.data ?? [];
    templates.value = templatesRes.data?.data ?? [];
    const preset = presets.value.find((item) => item.key === form.preset);
    if (preset) {
      form.duration_weeks = preset.default_weeks;
      if (!form.phase_name) form.phase_name = preset.label;
    }
  } catch (error) {
    presets.value = [];
    templates.value = [];
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudieron cargar presets ni plantillas'),
      color: 'error',
    });
  } finally {
    loadingMeta.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    resetForm();
    loadMeta();
  },
);

function selectPreset(key) {
  form.preset = key;
  const preset = presets.value.find((item) => item.key === key);
  if (!preset) return;
  form.duration_weeks = preset.default_weeks;
  form.phase_name = preset.label;
}

function addSeedDay() {
  const used = new Set(form.seed_days.map((row) => row.dia_semana));
  const next = DAYS.find((day) => !used.has(day)) || 'Lunes';
  form.seed_days.push(makeSeedRow(next));
}

function removeSeedDay(uid) {
  if (form.seed_days.length <= 1) return;
  const index = form.seed_days.findIndex((row) => row.uid === uid);
  if (index >= 0) form.seed_days.splice(index, 1);
}

function close() {
  if (props.saving) return;
  emit('update:modelValue', false);
}

function goNext() {
  if (step.value < 3 && canContinue.value) step.value += 1;
}

function goBack() {
  if (step.value > 1) step.value -= 1;
}

function openTemplatesTab() {
  emit('update:modelValue', false);
  router.push('/trainer/library');
}

function handleSubmit() {
  if (duplicatedDay.value) return;

  emit('submit', {
    program: {
      name: form.name.trim(),
      goal: form.goal.trim() || null,
      planned_weeks: Number(form.planned_weeks) || null,
    },
    phase: {
      preset: form.preset,
      name: form.phase_name.trim() || selectedPreset.value?.label,
      duration_weeks: Number(form.duration_weeks),
      seed_days: filledDays.value.map((row) => ({
        dia_semana: row.dia_semana,
        template_id: Number(row.template_id),
      })),
    },
  });
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    scrollable
    persistent
    scrim="rgba(0, 0, 0, 0.62)"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pw" bg-color="surface" rounded="xl">
      <v-card-item class="pw__head">
        <template #prepend>
          <div class="pw__head-icon" aria-hidden="true">
            <v-icon icon="mdi-chart-timeline-variant" size="22" color="primary" />
          </div>
        </template>
        <v-card-title class="pw__title">Nuevo programa</v-card-title>
        <v-card-subtitle class="pw__subtitle">
          Paso {{ step }} de 3 · {{ stepCaption }}
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

      <ol class="pw__steps" aria-label="Progreso del asistente">
        <li
          v-for="item in STEPS"
          :key="item.index"
          class="pw__step"
          :class="{
            'pw__step--on': step === item.index,
            'pw__step--done': step > item.index,
          }"
        >
          <span class="pw__step-dot" aria-hidden="true">
            <v-icon v-if="step > item.index" icon="mdi-check" size="14" />
            <template v-else>{{ item.index }}</template>
          </span>
          <span class="pw__step-label">{{ item.label }}</span>
        </li>
      </ol>

      <v-progress-linear
        v-if="loadingMeta"
        indeterminate
        color="primary"
        height="2"
      />

      <v-card-text class="pw__body">
        <section v-if="step === 1" class="pw__section" aria-label="Datos del macrociclo">
          <div class="pw__preview">
            <p class="pw__preview-name">{{ form.name.trim() || 'Nombre del programa' }}</p>
            <p class="pw__preview-meta">
              Macrociclo
              <span aria-hidden="true">·</span>
              <span>~{{ Number(form.planned_weeks) || '—' }} semanas</span>
            </p>
          </div>

          <v-text-field
            v-model="form.name"
            label="Nombre del programa"
            placeholder="Ej. Preparación fuerza 2026"
            prepend-inner-icon="mdi-calendar-star"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details="auto"
            autocomplete="off"
            :disabled="saving"
          />

          <v-textarea
            v-model="form.goal"
            label="Objetivo (opcional)"
            placeholder="Ej. Subir sentadilla 10 kg sin perder peso corporal"
            rows="2"
            auto-grow
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details="auto"
            :disabled="saving"
          />

          <v-text-field
            v-model.number="form.planned_weeks"
            label="Duración estimada"
            type="number"
            min="1"
            max="52"
            suffix="semanas"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details="auto"
            :disabled="saving"
          />
        </section>

        <section v-else-if="step === 2" class="pw__section" aria-label="Tipo de mesociclo">
          <p class="pw__label">Tipo de fase</p>
          <div class="pw__presets" role="group" aria-label="Tipos de mesociclo">
            <button
              v-for="preset in presets"
              :key="preset.key"
              type="button"
              class="pw__preset"
              :class="{ 'pw__preset--on': form.preset === preset.key }"
              :aria-pressed="form.preset === preset.key"
              :disabled="saving"
              @click="selectPreset(preset.key)"
            >
              <v-icon
                :icon="PRESET_ICONS[preset.key] || 'mdi-tune-variant'"
                size="18"
                aria-hidden="true"
              />
              <span class="pw__preset-label">{{ preset.label }}</span>
            </button>
          </div>

          <p v-if="selectedPreset" class="pw__preset-desc">
            {{ selectedPreset.description }}
          </p>

          <p class="pw__label">Microciclos (semanas)</p>
          <div class="pw__chips" role="group" aria-label="Duración del mesociclo">
            <button
              v-for="weeks in durationOptions"
              :key="weeks"
              type="button"
              class="pw__chip"
              :class="{ 'pw__chip--on': Number(form.duration_weeks) === weeks }"
              :aria-pressed="Number(form.duration_weeks) === weeks"
              :disabled="saving"
              @click="form.duration_weeks = weeks"
            >
              {{ weeks }}
            </button>
          </div>

          <v-text-field
            v-model="form.phase_name"
            label="Nombre de la fase"
            prepend-inner-icon="mdi-label-outline"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details="auto"
            :disabled="saving"
          />

          <p v-if="selectedPreset" class="pw__rule">
            <v-icon icon="mdi-trending-up" size="16" aria-hidden="true" />
            Progresión automática:
            <strong>{{ RULE_LABEL[selectedPreset.progression_rule] || selectedPreset.progression_rule }}</strong>
            <template v-if="selectedPreset.progression_value != null">
              ({{ selectedPreset.progression_value }})
            </template>
          </p>
        </section>

        <section v-else class="pw__section" aria-label="Semana base del mesociclo">
          <p class="pw__hint">
            Arma la <strong>semana 1</strong> con tus plantillas. Se copia al resto de
            microciclos aplicando la progresión de la fase.
          </p>

          <template v-if="templates.length">
            <div
              v-for="row in form.seed_days"
              :key="row.uid"
              class="pw__day"
            >
              <v-select
                v-model="row.dia_semana"
                :items="DAYS"
                label="Día"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                class="pw__day-select"
                :disabled="saving"
              />
              <v-select
                v-model="row.template_id"
                :items="templateItems"
                label="Plantilla"
                placeholder="Sin asignar"
                variant="outlined"
                density="comfortable"
                clearable
                hide-details="auto"
                class="pw__day-template"
                :disabled="saving"
              />
              <button
                type="button"
                class="pw__day-remove"
                aria-label="Quitar día"
                :disabled="saving || form.seed_days.length <= 1"
                @click="removeSeedDay(row.uid)"
              >
                <v-icon icon="mdi-close" size="18" />
              </button>
            </div>

            <v-btn
              variant="outlined"
              prepend-icon="mdi-plus"
              class="align-self-start"
              :disabled="saving"
              @click="addSeedDay"
            >
              Añadir día
            </v-btn>

            <p v-if="duplicatedDay" class="pw__warn" role="alert">
              <v-icon icon="mdi-alert-outline" size="16" aria-hidden="true" />
              {{ duplicatedDay }} está repetido. Cada día solo puede aparecer una vez.
            </p>
            <p v-else-if="!filledDays.length" class="pw__warn" role="status">
              <v-icon icon="mdi-information-outline" size="16" aria-hidden="true" />
              Sin plantillas elegidas se creará solo la estructura; añade los días antes de asignarlo.
            </p>
          </template>

          <div v-else-if="!loadingMeta" class="pw__empty" role="status">
            <div class="pw__empty-icon" aria-hidden="true">
              <v-icon icon="mdi-file-document-multiple-outline" size="26" color="primary" />
            </div>
            <p class="pw__empty-title">Aún no tienes plantillas</p>
            <p class="pw__empty-text">
              Crea plantillas de día (Pierna, Empuje…) y vuelve para montar la semana,
              o crea ahora solo la estructura del programa.
            </p>
            <v-btn
              color="primary"
              variant="tonal"
              class="mt-3 font-weight-bold"
              prepend-icon="mdi-file-document-plus-outline"
              :disabled="saving"
              @click="openTemplatesTab"
            >
              Ir a Plantillas
            </v-btn>
          </div>
        </section>
      </v-card-text>

      <v-card-actions class="pw__actions">
        <v-btn
          v-if="step > 1"
          variant="text"
          :disabled="saving"
          @click="goBack"
        >
          Atrás
        </v-btn>
        <v-spacer />
        <v-btn variant="outlined" :disabled="saving" @click="close">
          Cancelar
        </v-btn>
        <v-btn
          v-if="step < 3"
          color="primary"
          variant="flat"
          class="font-weight-bold"
          :disabled="!canContinue || saving"
          @click="goNext"
        >
          Siguiente
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="flat"
          class="font-weight-bold"
          :loading="saving"
          :disabled="!canContinue || saving"
          @click="handleSubmit"
        >
          {{ submitLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pw {
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pw__head {
  padding-top: 1rem !important;
  padding-bottom: 0.35rem !important;
}

.pw__head-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.pw__title {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  color: var(--tf-on-surface, #fff);
}

.pw__subtitle {
  white-space: normal !important;
  opacity: 1 !important;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
  font-size: 0.78rem !important;
}

.pw__steps {
  list-style: none;
  display: flex;
  gap: 0.35rem;
  margin: 0;
  padding: 0.25rem 1.25rem 0.75rem;
}

.pw__step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__step-dot {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
}

.pw__step-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pw__step--on {
  color: var(--tf-on-surface, #fff);
  font-weight: 700;
}

.pw__step--on .pw__step-dot {
  background: #00e5ff;
  border-color: #00e5ff;
  color: #0b0d12;
}

.pw__step--done .pw__step-dot {
  border-color: rgba(0, 229, 255, 0.5);
  color: #00e5ff;
}

.pw__body {
  padding-top: 0.5rem !important;
}

.pw__section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.pw__preview {
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(0, 229, 255, 0.18);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.1), transparent 55%),
    rgba(255, 255, 255, 0.03);
}

.pw__preview-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pw__preview-meta {
  margin: 0.3rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.5rem;
}

.pw__preset {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0.5rem 0.7rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.pw__preset:hover:not(:disabled) {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.08);
}

.pw__preset--on {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.16);
  color: #00e5ff;
}

.pw__preset-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pw__preset:focus-visible,
.pw__chip:focus-visible,
.pw__day-remove:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.pw__preset:disabled,
.pw__chip:disabled,
.pw__day-remove:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pw__preset-desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pw__chip {
  min-width: 44px;
  min-height: 40px;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.pw__chip--on {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.16);
  color: #00e5ff;
}

.pw__rule {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.8125rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__rule strong {
  color: var(--tf-on-surface, #fff);
}

.pw__hint {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__day {
  display: grid;
  grid-template-columns: minmax(7rem, 1fr) minmax(9rem, 1.6fr) 44px;
  gap: 0.5rem;
  align-items: start;
}

.pw__day-remove {
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

.pw__day-remove:hover:not(:disabled) {
  background: rgba(255, 82, 82, 0.16);
}

.pw__warn {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.75rem 1rem;
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.pw__empty-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.pw__empty-title {
  margin: 0.65rem 0 0.25rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.pw__empty-text {
  margin: 0;
  max-width: 34ch;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.pw__actions {
  display: flex !important;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem 1.25rem !important;
}

.pw :deep(.v-field--variant-outlined) {
  background: transparent;
}

.pw :deep(.v-label.v-field-label--floating) {
  font-size: 0.75rem !important;
  font-weight: 600;
  padding-inline: 0.2rem;
  background-color: rgb(var(--v-theme-surface)) !important;
}

@media (max-width: 480px) {
  .pw__day {
    grid-template-columns: 1fr 44px;
  }

  .pw__day-template {
    grid-column: 1 / -1;
    order: 3;
  }

  .pw__step-label {
    display: none;
  }

  .pw__steps {
    gap: 0.5rem;
  }

  .pw__step {
    flex: 0 0 auto;
  }
}
</style>
