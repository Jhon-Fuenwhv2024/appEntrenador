<script setup>
/**
 * Vista cliente: plan de dieta activo (solo lectura), agrupado por comidas.
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
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

const meals = computed(() => (Array.isArray(plan.value?.meals) ? plan.value.meals : []));

function formatNum(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function applyPlan(value) {
  plan.value = value ?? null;
  empty.value = !plan.value;
  loadError.value = '';
  loading.value = false;
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
      <div class="cdv__totals" aria-label="Totales del plan">
        <span class="cdv__chip cdv__chip--kcal">{{ formatNum(plan.calories) }} kcal</span>
        <span class="cdv__chip">P {{ formatNum(plan.protein_g) }}g</span>
        <span class="cdv__chip">C {{ formatNum(plan.carbs_g) }}g</span>
        <span class="cdv__chip">G {{ formatNum(plan.fats_g) }}g</span>
      </div>

      <p v-if="plan.notes" class="cdv__notes">{{ plan.notes }}</p>

      <article
        v-for="meal in meals"
        :key="meal.id"
        class="cdv__meal"
      >
        <header class="cdv__meal-head">
          <div>
            <h4 class="cdv__meal-name">{{ meal.name }}</h4>
            <p v-if="meal.time_hint" class="cdv__meal-time">{{ meal.time_hint }}</p>
          </div>
          <div class="cdv__meal-macros">
            {{ formatNum(meal.calories) }} kcal
          </div>
        </header>

        <ul class="cdv__items">
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
              <span>{{ formatNum(item.calories) }} kcal</span>
              <span>P {{ formatNum(item.protein_g) }}</span>
              <span>C {{ formatNum(item.carbs_g) }}</span>
              <span>G {{ formatNum(item.fats_g) }}</span>
            </div>
          </li>
        </ul>
      </article>
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

.cdv__totals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.65rem;
}

.cdv__chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
}

.cdv__chip--kcal {
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.cdv__notes {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: #c5cad3;
  line-height: 1.35;
}

.cdv__meal {
  margin-bottom: 0.7rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cdv__meal:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.cdv__meal-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.cdv__meal-name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
}

.cdv__meal-time {
  margin: 0.1rem 0 0;
  font-size: 0.68rem;
  color: #8b929e;
}

.cdv__meal-macros {
  font-size: 0.72rem;
  font-weight: 600;
  color: #8b929e;
  white-space: nowrap;
}

.cdv__items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cdv__item {
  padding: 0.35rem 0;
}

.cdv__item-main {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.cdv__item-name {
  font-size: 0.8rem;
  font-weight: 600;
}

.cdv__item-qty {
  font-size: 0.72rem;
  color: #8b929e;
  white-space: nowrap;
}

.cdv__item-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.15rem;
  font-size: 0.68rem;
  color: #8b929e;
}
</style>
