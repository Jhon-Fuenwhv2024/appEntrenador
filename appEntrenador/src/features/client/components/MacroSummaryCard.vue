<script setup>
/**
 * Tarjeta cliente: resumen de objetivos nutricionales diarios (solo lectura).
 * Puede hidratarse desde GET /me/today (Feature 038) vía initialTarget + skipFetch.
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getClientNutrition } from '../api/nutritionApi.js';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
  /** Objetivos ya cargados por el agregador /me/today (o null). */
  initialTarget: {
    type: Object,
    default: undefined,
  },
  /** Si true, no llama a GET /nutrition/:id (usa initialTarget). */
  skipFetch: {
    type: Boolean,
    default: false,
  },
  /** Layout denso para el home immersivo. */
  compact: {
    type: Boolean,
    default: false,
  },
  /** Feature 083: macros planificados o eaten del día (vs objetivo). */
  planned: {
    type: Object,
    default: null,
  },
});

const loading = shallowRef(false);
const loadError = shallowRef('');
const target = shallowRef(null);
const empty = shallowRef(false);

const macros = computed(() => {
  const t = target.value;
  if (!t) return [];
  const planned = props.planned;
  return [
    {
      key: 'protein',
      short: 'P',
      label: 'Proteína',
      grams: t.protein_g,
      plannedGrams: planned?.protein_g,
      color: '#EF5350',
    },
    {
      key: 'carbs',
      short: 'C',
      label: 'Carbohidratos',
      grams: t.carbs_g,
      plannedGrams: planned?.carbs_g,
      color: '#42A5F5',
    },
    {
      key: 'fats',
      short: 'G',
      label: 'Grasas',
      grams: t.fats_g,
      plannedGrams: planned?.fats_g,
      color: '#FFCA28',
    },
  ];
});

const plannedKcal = computed(() => {
  if (props.planned?.calories == null) return null;
  return Math.round(Number(props.planned.calories) || 0);
});

const goalKcal = computed(() => {
  const n = Number(target.value?.calories);
  return Number.isFinite(n) ? Math.round(n) : null;
});

const hasPlanCompare = computed(() => plannedKcal.value != null && goalKcal.value != null);

const kcalCaption = computed(() => {
  if (!hasPlanCompare.value) return 'Meta diaria de tu entrenador';
  if (plannedKcal.value > goalKcal.value) {
    return 'El plan de hoy supera tu meta de kcal';
  }
  return 'Compara lo del plan de hoy con tu meta';
});

function progressPct(plannedGrams, goalGrams) {
  const goal = Number(goalGrams);
  const planned = Number(plannedGrams);
  if (!Number.isFinite(goal) || goal <= 0 || !Number.isFinite(planned)) return 0;
  return Math.min(100, Math.round((planned / goal) * 100));
}

function isOverGoal(plannedGrams, goalGrams) {
  const goal = Number(goalGrams);
  const planned = Number(plannedGrams);
  return Number.isFinite(goal) && goal > 0 && Number.isFinite(planned) && planned > goal;
}

function plannedLabel(grams) {
  return `${Math.round(Number(grams) || 0)}g`;
}

function applyInitialTarget(value) {
  target.value = value ?? null;
  empty.value = !target.value;
  loadError.value = '';
  loading.value = false;
}

async function loadTarget() {
  if (props.skipFetch) {
    applyInitialTarget(props.initialTarget);
    return;
  }

  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    empty.value = false;
    const response = await getClientNutrition(props.clientId);
    target.value = response.data.data ?? null;
    empty.value = !target.value;
  } catch (error) {
    const code = error?.normalized?.code || error?.response?.status;
    if (code === 404) {
      target.value = null;
      empty.value = true;
      loadError.value = '';
      return;
    }
    console.error('Error cargando objetivos nutricionales:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar tus objetivos');
    target.value = null;
    empty.value = false;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.clientId,
  () => {
    if (!props.skipFetch) loadTarget();
  },
);

watch(
  () => props.initialTarget,
  (next) => {
    if (props.skipFetch) applyInitialTarget(next);
  },
);

onMounted(() => {
  loadTarget();
});
</script>

<template>
  <v-card
    class="macro-summary"
    :class="{ 'macro-summary--compact': compact }"
    variant="flat"
    rounded="lg"
  >
    <template v-if="compact && target && !loading && !loadError">
      <div class="macro-summary__compact">
        <header class="macro-summary__compact-head">
          <div class="macro-summary__compact-titles">
            <h3 class="macro-summary__compact-title">
              <v-icon icon="mdi-food-apple-outline" size="18" color="primary" />
              Nutrición de hoy
            </h3>
            <p class="macro-summary__compact-hint">{{ kcalCaption }}</p>
          </div>
        </header>

        <div
          v-if="hasPlanCompare"
          class="macro-summary__legend"
          aria-label="Leyenda nutrición"
        >
          <span class="macro-summary__legend-item">
            <span class="macro-summary__legend-swatch macro-summary__legend-swatch--plan" />
            Del plan
          </span>
          <span class="macro-summary__legend-item">
            <span class="macro-summary__legend-swatch macro-summary__legend-swatch--goal" />
            Meta entrenador
          </span>
        </div>

        <div class="macro-summary__kcal-card" aria-label="Calorías">
          <div class="macro-summary__kcal-col">
            <p class="macro-summary__kcal-label">Del plan</p>
            <p class="macro-summary__kcal-num text-cyan">
              {{ plannedKcal ?? '—' }}
              <span class="macro-summary__kcal-unit">kcal</span>
            </p>
          </div>
          <div class="macro-summary__kcal-divider" aria-hidden="true" />
          <div class="macro-summary__kcal-col macro-summary__kcal-col--right">
            <p class="macro-summary__kcal-label">Tu meta</p>
            <p class="macro-summary__kcal-num">
              {{ goalKcal ?? '—' }}
              <span class="macro-summary__kcal-unit">kcal</span>
            </p>
          </div>
        </div>

        <div class="macro-summary__bars" role="list" aria-label="Macros del plan vs meta">
          <div
            v-for="macro in macros"
            :key="macro.key"
            class="macro-summary__bar-row"
            role="listitem"
          >
            <div class="macro-summary__bar-head">
              <span class="macro-summary__bar-label">
                <span
                  class="macro-summary__bar-badge"
                  :style="{ color: macro.color, borderColor: macro.color }"
                >
                  {{ macro.short }}
                </span>
                <span class="macro-summary__bar-name">{{ macro.label }}</span>
              </span>
              <span
                class="macro-summary__bar-value"
                :class="{
                  'macro-summary__bar-value--over':
                    macro.plannedGrams != null && isOverGoal(macro.plannedGrams, macro.grams),
                }"
              >
                <template v-if="macro.plannedGrams != null">
                  <span :style="{ color: macro.color }">{{ plannedLabel(macro.plannedGrams) }}</span>
                  <span class="macro-summary__bar-goal"> meta {{ plannedLabel(macro.grams) }}</span>
                </template>
                <template v-else>
                  <span class="macro-summary__bar-goal">meta {{ plannedLabel(macro.grams) }}</span>
                </template>
              </span>
            </div>
            <div
              class="macro-summary__track"
              role="progressbar"
              :aria-valuenow="macro.plannedGrams != null ? progressPct(macro.plannedGrams, macro.grams) : 0"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="macro.plannedGrams != null
                ? `${macro.label}: ${plannedLabel(macro.plannedGrams)} del plan, meta ${plannedLabel(macro.grams)}`
                : `${macro.label}: meta ${plannedLabel(macro.grams)}`"
            >
              <div
                class="macro-summary__fill"
                :style="{
                  width: `${macro.plannedGrams != null ? progressPct(macro.plannedGrams, macro.grams) : 0}%`,
                  backgroundColor: macro.color,
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <v-card-title class="macro-summary__title">
        <v-icon icon="mdi-food-apple-outline" size="20" class="mr-2" color="primary" />
        Nutrición · objetivos diarios
      </v-card-title>

      <v-card-text class="pt-2">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-2"
          height="2"
        />

        <v-alert
          v-else-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
        >
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="x-small" @click="loadTarget">Reintentar</v-btn>
          </template>
        </v-alert>

        <div v-else-if="empty" class="macro-summary__empty">
          <p class="macro-summary__empty-title">
            Aún no hay objetivos nutricionales
          </p>
        </div>

        <div v-else-if="target" class="macro-summary__body">
          <div class="macro-summary__calories">
            <span class="macro-summary__cal-value">{{ target.calories }}</span>
            <span class="macro-summary__cal-unit">kcal</span>
          </div>
          <div class="macro-summary__macros">
            <div
              v-for="macro in macros"
              :key="macro.key"
              class="macro-summary__row"
            >
              <div class="macro-summary__row-head">
                <span class="macro-summary__macro-label">{{ macro.label }}</span>
                <span class="macro-summary__macro-grams" :style="{ color: macro.color }">
                  {{ macro.grams }} g
                </span>
              </div>
              <v-progress-linear
                :model-value="100"
                :color="macro.color"
                height="6"
                rounded
              />
            </div>
          </div>
        </div>
      </v-card-text>
    </template>
  </v-card>
</template>

<style scoped>
.macro-summary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.macro-summary--compact {
  border-radius: 12px !important;
}

.macro-summary__compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
}

.macro-summary__compact-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.macro-summary__compact-titles {
  min-width: 0;
}

.macro-summary__compact-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.92rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.macro-summary__compact-hint {
  margin: 4px 0 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.macro-summary__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.macro-summary__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 650;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.macro-summary__legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.macro-summary__legend-swatch--plan {
  background: rgb(var(--v-theme-primary));
}

.macro-summary__legend-swatch--goal {
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-sizing: border-box;
}

.macro-summary__kcal-card {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.macro-summary__kcal-col {
  min-width: 0;
}

.macro-summary__kcal-col--right {
  text-align: right;
}

.macro-summary__kcal-label {
  margin: 0 0 4px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.macro-summary__kcal-num {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #f2f4f7;
}

.macro-summary__kcal-num.text-cyan {
  color: rgb(var(--v-theme-primary));
}

.macro-summary__kcal-unit {
  margin-left: 4px;
  font-size: 0.68rem;
  font-weight: 650;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: lowercase;
}

.macro-summary__kcal-divider {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.1);
}

.macro-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.macro-summary__bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 2px;
}

.macro-summary__bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.macro-summary__bar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.macro-summary__bar-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.macro-summary__bar-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.macro-summary__bar-name {
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.2;
}

.macro-summary__bar-value {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  line-height: 1.2;
  text-align: right;
}

.macro-summary__bar-value--over span:first-child {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.macro-summary__bar-goal {
  font-weight: 650;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.macro-summary__track {
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.macro-summary__fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
  transition: width 0.35s ease;
}

.macro-summary__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.7rem;
  font-weight: 700;
}

.macro-summary__chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.macro-summary__chip-label {
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.macro-summary__title {
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  padding: 12px 16px 0;
}

.macro-summary__empty {
  text-align: center;
  padding: 0.5rem 0;
}

.macro-summary__empty-title {
  margin: 0;
  font-size: 0.82rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.macro-summary__body {
  text-align: center;
}

.macro-summary__calories {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.35rem;
  line-height: 1;
  margin-bottom: 0.85rem;
}

.macro-summary__cal-value {
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: rgb(var(--v-theme-primary));
}

.macro-summary__cal-unit {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: uppercase;
}

.macro-summary__macros {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  text-align: left;
}

.macro-summary__row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.macro-summary__macro-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.macro-summary__macro-grams {
  font-size: 0.78rem;
  font-weight: 700;
}
</style>
