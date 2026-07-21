<script setup>
/**
 * Vista cliente: plan de dieta activo (solo lectura), agrupado por comidas.
 * Feature 057 — jerarquía visual tipo diario: comida (cabecera) vs productos (filas).
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getMyDietPlan } from '../api/dietPlansApi.js';

const props = defineProps({
  /** Plan ya cargado (opcional). */
  initialPlan: {
    type: Object,
    default: undefined,
  },
  /** Si true, no llama a GET /me/diet-plan. */
  skipFetch: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const loading = shallowRef(false);
const loadError = shallowRef('');
const plan = shallowRef(null);
const empty = shallowRef(false);
/** Meal ids currently expanded in the accordion. */
const expandedIds = ref([]);

const meals = computed(() => (Array.isArray(plan.value?.meals) ? plan.value.meals : []));

const MEAL_ACCENTS = [
  {
    match: /desayuno|breakfast|mañana|amanecer/i,
    icon: 'mdi-weather-sunset-up',
    color: '#FFB74D',
  },
  {
    match: /almuerzo|comida|lunch|mediod[ií]a/i,
    icon: 'mdi-white-balance-sunny',
    color: '#66BB6A',
  },
  {
    match: /cena|dinner|noche|vespertin/i,
    icon: 'mdi-weather-night',
    color: '#AB47BC',
  },
  {
    match: /snack|merienda|colaci[oó]n|tentempi[eé]|entre/i,
    icon: 'mdi-cookie-outline',
    color: '#FF7043',
  },
];

const DEFAULT_ACCENT = {
  icon: 'mdi-food-apple-outline',
  color: '#00E5FF',
};

/** Same palette as MacroSummaryCard (Nutrición). */
const MACRO_COLORS = {
  protein: '#EF5350',
  carbs: '#42A5F5',
  fats: '#FFCA28',
};

function mealAccent(name) {
  const label = String(name || '');
  const found = MEAL_ACCENTS.find((entry) => entry.match.test(label));
  return found || DEFAULT_ACCENT;
}

function formatNum(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

const planMacros = computed(() => {
  const p = plan.value;
  if (!p) return [];
  return [
    {
      key: 'protein',
      label: 'Proteína',
      short: 'P',
      grams: formatNum(p.protein_g),
      color: MACRO_COLORS.protein,
    },
    {
      key: 'carbs',
      label: 'Carbohidratos',
      short: 'C',
      grams: formatNum(p.carbs_g),
      color: MACRO_COLORS.carbs,
    },
    {
      key: 'fats',
      label: 'Grasas',
      short: 'G',
      grams: formatNum(p.fats_g),
      color: MACRO_COLORS.fats,
    },
  ];
});

function isExpanded(mealId) {
  return expandedIds.value.includes(mealId);
}

function toggleMeal(mealId) {
  if (isExpanded(mealId)) {
    expandedIds.value = expandedIds.value.filter((id) => id !== mealId);
  } else {
    expandedIds.value = [...expandedIds.value, mealId];
  }
}

function syncExpandedFromPlan() {
  // Collapsed by default — user expands meals on tap (Feature 057).
  expandedIds.value = [];
}

function applyPlan(value) {
  plan.value = value ?? null;
  empty.value = !plan.value;
  loadError.value = '';
  loading.value = false;
  syncExpandedFromPlan();
}

async function loadPlan() {
  if (props.skipFetch) {
    applyPlan(props.initialPlan);
    return;
  }

  try {
    loading.value = true;
    loadError.value = '';
    empty.value = false;
    const response = await getMyDietPlan();
    applyPlan(response.data?.data ?? null);
  } catch (error) {
    console.error('Error cargando plan de dieta:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu plan de dieta');
    plan.value = null;
    empty.value = false;
    expandedIds.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.skipFetch, props.initialPlan],
  () => {
    if (props.skipFetch) {
      applyPlan(props.initialPlan);
    }
  },
);

onMounted(() => {
  loadPlan();
});
</script>

<template>
  <section
    class="cdv"
    :class="{ 'cdv--compact': compact }"
    aria-label="Plan de dieta del día"
  >
    <div class="cdv__head">
      <h3 class="cdv__title">Mi plan de dieta</h3>
      <p v-if="plan" class="cdv__subtitle">{{ plan.title }}</p>
      <p v-else class="cdv__subtitle">Consumo previsto del día</p>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" height="2" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" density="compact" class="mb-2">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadPlan">Reintentar</v-btn>
      </template>
    </v-alert>

    <p v-else-if="empty" class="cdv__empty">
      Tu entrenador aún no te ha asignado un plan de dieta activo.
    </p>

    <template v-else-if="plan">
      <div class="cdv__summary" aria-label="Totales del plan">
        <div class="cdv__summary-kcal">
          <span class="cdv__summary-kcal-value">{{ formatNum(plan.calories) }}</span>
          <span class="cdv__summary-kcal-unit">kcal del plan</span>
        </div>
        <div class="cdv__summary-macros">
          <div
            v-for="macro in planMacros"
            :key="macro.key"
            class="cdv__metric"
            :style="{ '--macro-color': macro.color }"
          >
            <span class="cdv__metric-letter">{{ macro.short }}</span>
            <span class="cdv__metric-grams">{{ macro.grams }}g</span>
            <span class="cdv__metric-label">{{ macro.label }}</span>
          </div>
        </div>
      </div>

      <p v-if="plan.notes" class="cdv__notes">{{ plan.notes }}</p>

      <div class="cdv__meals" role="list">
        <article
          v-for="meal in meals"
          :key="meal.id"
          class="cdv__meal"
          :style="{ '--meal-accent': mealAccent(meal.name).color }"
          role="listitem"
        >
          <button
            type="button"
            class="cdv__meal-head"
            :aria-expanded="isExpanded(meal.id)"
            :aria-controls="`cdv-meal-${meal.id}`"
            @click="toggleMeal(meal.id)"
          >
            <span
              class="cdv__meal-icon"
              aria-hidden="true"
            >
              <v-icon :icon="mealAccent(meal.name).icon" size="20" />
            </span>
            <span class="cdv__meal-copy">
              <span class="cdv__meal-name">{{ meal.name }}</span>
              <span v-if="meal.time_hint" class="cdv__meal-time">{{ meal.time_hint }}</span>
            </span>
            <span class="cdv__meal-kcal">{{ formatNum(meal.calories) }} kcal</span>
            <v-icon
              class="cdv__meal-chevron"
              :icon="isExpanded(meal.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="20"
            />
          </button>

          <div
            v-show="isExpanded(meal.id)"
            :id="`cdv-meal-${meal.id}`"
            class="cdv__meal-body"
          >
            <ul
              v-if="Array.isArray(meal.items) && meal.items.length"
              class="cdv__items"
            >
              <li
                v-for="item in meal.items"
                :key="item.id"
                class="cdv__item"
              >
                <div class="cdv__item-main">
                  <span class="cdv__item-name">{{ item.food_name }}</span>
                  <span class="cdv__item-qty">
                    {{ formatNum(item.quantity) }} {{ item.unit }}
                  </span>
                </div>
                <div class="cdv__item-macros">
                  <span class="cdv__item-kcal">{{ formatNum(item.calories) }} kcal</span>
                  <span class="cdv__item-macro" :style="{ color: MACRO_COLORS.protein }">
                    P {{ formatNum(item.protein_g) }}
                  </span>
                  <span class="cdv__item-macro" :style="{ color: MACRO_COLORS.carbs }">
                    C {{ formatNum(item.carbs_g) }}
                  </span>
                  <span class="cdv__item-macro" :style="{ color: MACRO_COLORS.fats }">
                    G {{ formatNum(item.fats_g) }}
                  </span>
                </div>
              </li>
            </ul>
            <p v-else class="cdv__items-empty">Sin alimentos en esta comida.</p>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cdv {
  margin-top: 0.85rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cdv--compact {
  padding: 0.75rem 0.8rem;
}

.cdv__head {
  margin-bottom: 0.55rem;
}

.cdv__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.cdv__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.7rem;
  color: #8b929e;
}

.cdv__empty {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: #8b929e;
}

.cdv__summary {
  display: grid;
  grid-template-columns: minmax(4.25rem, auto) 1fr;
  gap: 0.45rem 0.55rem;
  align-items: stretch;
  margin-bottom: 0.65rem;
  padding: 0.45rem 0.5rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cdv__summary-kcal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
  padding-right: 0.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 0;
}

.cdv__summary-kcal-value {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: rgb(var(--v-theme-primary));
}

.cdv__summary-kcal-unit {
  font-size: 0.6rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b929e;
  line-height: 1.2;
}

.cdv__summary-macros {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3rem;
  min-width: 0;
}

.cdv__metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 0.2rem 0.3rem 0.25rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 2px solid var(--macro-color, #00e5ff);
  min-width: 0;
}

.cdv__metric-letter {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--macro-color, #00e5ff);
  line-height: 1;
}

.cdv__metric-grams {
  font-size: 0.88rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #f2f4f7;
  line-height: 1.1;
}

.cdv__metric-label {
  font-size: 0.58rem;
  font-weight: 600;
  color: #8b929e;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 380px) {
  .cdv__summary {
    grid-template-columns: 1fr;
  }

  .cdv__summary-kcal {
    flex-direction: row;
    align-items: baseline;
    gap: 0.4rem;
    padding-right: 0;
    padding-bottom: 0.45rem;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.cdv__notes {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: #c5cad3;
  line-height: 1.35;
}

.cdv__meals {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.cdv__meal {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.22);
  border-left: 3px solid var(--meal-accent, #00e5ff);
  overflow: hidden;
}

.cdv__meal-head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  margin: 0;
  padding: 0.7rem 0.65rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.cdv__meal-head:hover {
  background: rgba(0, 229, 255, 0.06);
}

.cdv__meal-head:focus-visible {
  outline: 2px solid rgba(0, 229, 255, 0.55);
  outline-offset: -2px;
}

.cdv__meal-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
  color: var(--meal-accent, #00e5ff);
  background: color-mix(in srgb, var(--meal-accent, #00e5ff) 18%, transparent);
}

.cdv__meal-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.cdv__meal-name {
  font-size: 0.92rem;
  font-weight: 750;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: #f2f4f7;
}

.cdv__meal-time {
  font-size: 0.68rem;
  color: #8b929e;
}

.cdv__meal-kcal {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--meal-accent, #00e5ff);
  white-space: nowrap;
}

.cdv__meal-chevron {
  flex-shrink: 0;
  color: #8b929e;
}

.cdv__meal-body {
  padding: 0 0.55rem 0.55rem 0.55rem;
}

.cdv__items {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.cdv__item {
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.cdv__item:last-child {
  border-bottom: none;
}

.cdv__item-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.cdv__item-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: #d5dae3;
  line-height: 1.25;
}

.cdv__item-qty {
  font-size: 0.7rem;
  color: #8b929e;
  white-space: nowrap;
}

.cdv__item-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.2rem;
  font-size: 0.65rem;
}

.cdv__item-kcal {
  color: #8b929e;
}

.cdv__item-macro {
  font-weight: 700;
}

.cdv__items-empty {
  margin: 0;
  padding: 0.45rem 0.35rem;
  font-size: 0.75rem;
  color: #8b929e;
}
</style>
