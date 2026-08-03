<script setup>
/**
 * Vista cliente: plan de dieta activo del día resuelto (ciclo multi-semana).
 * Feature 057 jerarquía + Feature 064 resolución por fecha / strip semanal.
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  getApiErrorMessage,
  isMembershipBlockedError,
} from '../../../shared/api/http.js';
import { getMyDietPlan, getMyDietPlanWeek, upsertMealAdherence } from '../api/dietPlansApi.js';
import { todayLocalDate } from '../../../shared/utils/localDate.js';

const router = useRouter();

const props = defineProps({
  /** Respuesta ya cargada de GET /me/diet-plan (opcional). */
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
  /** Soft-lock por membresía vencida (Feature 040), desde el dashboard. */
  membershipBlocked: {
    type: Boolean,
    default: false,
  },
  /** Resumen dieta desde GET /me/today (083). */
  dietSummary: {
    type: Object,
    default: null,
  },
  /** Destacar próxima comida (postWorkout). */
  highlightNext: {
    type: Boolean,
    default: false,
  },
  /** Objetivos nutricionales del entrenador (031) para snapshot unificado en home. */
  macroTargets: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['adherence-changed']);

const MEMBERSHIP_BLOCKED_MSG = 'Membresía vencida — habla con tu entrenador';

const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];
const DAY_SHORT = {
  Lunes: 'L',
  Martes: 'M',
  Miércoles: 'X',
  Jueves: 'J',
  Viernes: 'V',
  Sábado: 'S',
  Domingo: 'D',
};

const loading = shallowRef(false);
const loadError = shallowRef('');
const blockedByMembership = shallowRef(false);
const plan = shallowRef(null);
const weekPreview = shallowRef(null);
const empty = shallowRef(false);
const expandedIds = ref([]);
const selectedDia = ref(null);
const detailsOpen = shallowRef(false);
const adherenceByMeal = ref(new Map());
const savingMealId = shallowRef(null);
const celebrateMealId = shallowRef(null);

const isLocked = computed(
  () => props.membershipBlocked || blockedByMembership.value,
);

function todayYmd() {
  return todayLocalDate();
}

const resolved = computed(() => plan.value?.resolved || null);

const viewingDia = computed(
  () => selectedDia.value || resolved.value?.dia_semana || 'Lunes',
);

const isTodayView = computed(
  () => viewingDia.value === resolved.value?.dia_semana,
);

const dayPayload = computed(() => {
  if (!plan.value) return null;
  if (isTodayView.value) return plan.value.day;

  const slot = (weekPreview.value?.days || []).find(
    (d) => d.dia_semana === viewingDia.value,
  );
  if (!slot) return null;
  return {
    id: slot.id,
    week_index: slot.week_index,
    dia_semana: slot.dia_semana,
    notes: slot.notes,
    calories: slot.calories,
    protein_g: slot.protein_g,
    carbs_g: slot.carbs_g,
    fats_g: slot.fats_g,
    meals: slot.meals || [],
  };
});

const meals = computed(() =>
  (Array.isArray(dayPayload.value?.meals) ? dayPayload.value.meals : []),
);

const dayEmpty = computed(
  () => Boolean(plan.value) && (!dayPayload.value || !meals.value.length),
);

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

const dayMacros = computed(() => {
  const d = dayPayload.value;
  if (!d) return [];
  return [
    {
      key: 'protein',
      label: 'Proteína',
      short: 'P',
      grams: formatNum(d.protein_g),
      color: MACRO_COLORS.protein,
    },
    {
      key: 'carbs',
      label: 'Carbohidratos',
      short: 'C',
      grams: formatNum(d.carbs_g),
      color: MACRO_COLORS.carbs,
    },
    {
      key: 'fats',
      label: 'Grasas',
      short: 'G',
      grams: formatNum(d.fats_g),
      color: MACRO_COLORS.fats,
    },
  ];
});

const weekStrip = computed(() => {
  const days = weekPreview.value?.days || [];
  return DAYS.map((dia) => {
    const slot = days.find((d) => d.dia_semana === dia);
    return {
      dia,
      short: DAY_SHORT[dia],
      filled: Boolean(slot?.has_meals || slot?.meals?.length),
      calories: Number(slot?.calories) || 0,
      isResolved: dia === resolved.value?.dia_semana,
      isSelected: dia === viewingDia.value,
    };
  });
});

const headerSubtitle = computed(() => {
  if (!plan.value || !resolved.value) return 'Consumo previsto del día';
  const week = resolved.value.week_index;
  const label = isTodayView.value ? 'Hoy' : viewingDia.value;
  return `${label} · Semana ${week} · ${viewingDia.value}`;
});

function mealStatus(mealId) {
  return adherenceByMeal.value.get(Number(mealId)) || null;
}

const nextMeal = computed(() => {
  // Mantener la comida recién marcada para que lean la confirmación.
  if (celebrateMealId.value) {
    const justMarked = meals.value.find(
      (m) => Number(m.id) === Number(celebrateMealId.value),
    );
    if (justMarked) return justMarked;
  }
  if (props.dietSummary?.nextMeal && isTodayView.value) {
    const fromPlan = meals.value.find(
      (m) => Number(m.id) === Number(props.dietSummary.nextMeal.id),
    );
    if (fromPlan) return fromPlan;
  }
  const pending = meals.value.find((m) => {
    const s = mealStatus(m.id);
    return s !== 'eaten' && s !== 'skipped';
  });
  return pending || meals.value[0] || null;
});

const nextMealStatus = computed(() => mealStatus(nextMeal.value?.id));

/** Snapshot unificado: plan del día vs meta del entrenador (una sola tarjeta en home). */
const planSnapshot = computed(() => {
  const fromDiet = props.dietSummary?.planned || props.dietSummary?.eaten;
  const fromDay = isTodayView.value && dayPayload.value
    ? {
        calories: dayPayload.value.calories,
        protein_g: dayPayload.value.protein_g,
        carbs_g: dayPayload.value.carbs_g,
        fats_g: dayPayload.value.fats_g,
      }
    : null;
  return fromDiet || fromDay || null;
});

const goalSnapshot = computed(() => props.macroTargets || null);

const showHomeSnapshot = computed(() => (
  props.compact && plan.value && !isLocked.value && (planSnapshot.value || goalSnapshot.value)
));

const snapshotMacros = computed(() => {
  const dayPlan = planSnapshot.value;
  const goal = goalSnapshot.value;
  if (!dayPlan && !goal) return [];
  return [
    {
      key: 'protein',
      short: 'P',
      label: 'Proteína',
      plan: dayPlan?.protein_g,
      goal: goal?.protein_g,
      color: MACRO_COLORS.protein,
    },
    {
      key: 'carbs',
      short: 'C',
      label: 'Carbs',
      plan: dayPlan?.carbs_g,
      goal: goal?.carbs_g,
      color: MACRO_COLORS.carbs,
    },
    {
      key: 'fats',
      short: 'G',
      label: 'Grasas',
      plan: dayPlan?.fats_g,
      goal: goal?.fats_g,
      color: MACRO_COLORS.fats,
    },
  ];
});

function macroBarPct(planG, goalG) {
  const goal = Number(goalG);
  const plan = Number(planG);
  if (!Number.isFinite(goal) || goal <= 0 || !Number.isFinite(plan)) return 0;
  return Math.min(100, Math.round((plan / goal) * 100));
}

function syncAdherenceFromSummary(summary) {
  const map = new Map(adherenceByMeal.value);
  for (const row of summary?.mealAdherence || []) {
    if (row?.diet_meal_id != null && row.status) {
      map.set(Number(row.diet_meal_id), row.status);
    }
  }
  adherenceByMeal.value = map;
}

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
  expandedIds.value = [];
}

function applyPlan(value) {
  plan.value = value ?? null;
  empty.value = !plan.value;
  loadError.value = '';
  blockedByMembership.value = false;
  loading.value = false;
  selectedDia.value = value?.resolved?.dia_semana || null;
  syncExpandedFromPlan();
}

async function loadWeek(date) {
  try {
    const response = await getMyDietPlanWeek(date);
    weekPreview.value = response.data?.data ?? null;
  } catch (error) {
    if (isMembershipBlockedError(error)) {
      blockedByMembership.value = true;
    }
    console.error('Error cargando semana del plan:', error);
    weekPreview.value = null;
  }
}

async function loadPlan() {
  if (props.membershipBlocked) {
    loading.value = false;
    loadError.value = '';
    blockedByMembership.value = true;
    plan.value = null;
    weekPreview.value = null;
    empty.value = false;
    return;
  }

  if (props.skipFetch) {
    applyPlan(props.initialPlan);
    if (props.initialPlan?.resolved?.date) {
      await loadWeek(props.initialPlan.resolved.date);
    }
    return;
  }

  try {
    loading.value = true;
    loadError.value = '';
    blockedByMembership.value = false;
    empty.value = false;
    const date = todayYmd();
    const response = await getMyDietPlan(date);
    applyPlan(response.data?.data ?? null);
    if (response.data?.data) {
      await loadWeek(date);
    } else {
      weekPreview.value = null;
    }
  } catch (error) {
    console.error('Error cargando plan de dieta:', error);
    plan.value = null;
    weekPreview.value = null;
    empty.value = false;
    expandedIds.value = [];
    if (isMembershipBlockedError(error)) {
      blockedByMembership.value = true;
      loadError.value = '';
    } else {
      blockedByMembership.value = false;
      loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu plan de dieta');
    }
  } finally {
    loading.value = false;
  }
}

function selectStripDay(dia) {
  selectedDia.value = dia;
  syncExpandedFromPlan();
}

function goShoppingList() {
  router.push({ name: 'ClientShoppingList' });
}

async function setAdherence(meal, status) {
  const mealId = Number(meal?.id);
  if (!mealId || !isTodayView.value || isLocked.value) return;
  if (savingMealId.value === mealId) return;

  const prev = mealStatus(mealId);
  const map = new Map(adherenceByMeal.value);
  map.set(mealId, status);
  adherenceByMeal.value = map;

  try {
    savingMealId.value = mealId;
    await upsertMealAdherence(mealId, {
      date: todayYmd(),
      status,
    });
    if (status === 'eaten' || status === 'skipped') {
      celebrateMealId.value = mealId;
      setTimeout(() => {
        if (celebrateMealId.value === mealId) celebrateMealId.value = null;
      }, 2200);
    }
    emit('adherence-changed', { mealId, status });
  } catch (error) {
    const rollback = new Map(adherenceByMeal.value);
    if (prev) rollback.set(mealId, prev);
    else rollback.delete(mealId);
    adherenceByMeal.value = rollback;
    console.error('Error guardando adherencia:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo guardar la comida');
  } finally {
    savingMealId.value = null;
  }
}

watch(
  () => [props.skipFetch, props.initialPlan, props.membershipBlocked],
  async () => {
    if (props.membershipBlocked) {
      blockedByMembership.value = true;
      loadError.value = '';
      plan.value = null;
      weekPreview.value = null;
      empty.value = false;
      loading.value = false;
      return;
    }
    if (props.skipFetch) {
      applyPlan(props.initialPlan);
      if (props.initialPlan?.resolved?.date) {
        await loadWeek(props.initialPlan.resolved.date);
      }
    }
  },
);

watch(
  () => props.dietSummary,
  (next) => {
    if (next) syncAdherenceFromSummary(next);
  },
  { immediate: true },
);

onMounted(() => {
  loadPlan();
});
</script>

<template>
  <section
    class="cdv"
    :class="{
      'cdv--compact': compact,
      'cdv--locked': isLocked,
      'cdv--highlight': highlightNext && compact,
      'cdv--home': compact,
    }"
    aria-label="Alimentación de hoy"
  >
    <div class="cdv__head">
      <div class="cdv__head-row">
        <h3 class="cdv__title">{{ compact ? 'Alimentación de hoy' : 'Mi plan de dieta' }}</h3>
        <button
          v-if="plan && !isLocked"
          type="button"
          class="cdv__cart-btn"
          aria-label="Abrir lista de compra"
          title="Lista de compra"
          @click="goShoppingList"
        >
          <v-icon icon="mdi-cart-outline" size="20" />
        </button>
      </div>
      <p v-if="plan && !isLocked" class="cdv__plan-name">{{ plan.title }}</p>
      <p class="cdv__subtitle">{{ isLocked ? 'Acceso pausado' : headerSubtitle }}</p>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" height="2" />

    <div
      v-else-if="isLocked"
      class="cdv__locked"
      role="status"
      aria-live="polite"
    >
      <p class="cdv__locked-eyebrow">Bloqueado</p>
      <p class="cdv__locked-msg">{{ MEMBERSHIP_BLOCKED_MSG }}</p>
      <v-btn
        color="error"
        variant="tonal"
        size="small"
        rounded="lg"
        disabled
        prepend-icon="mdi-lock"
        class="font-weight-bold"
      >
        Bloqueado
      </v-btn>
    </div>

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
      <!-- Snapshot kcal/macros: una sola tarjeta con el plan (sin Nutrición aparte) -->
      <div
        v-if="showHomeSnapshot"
        class="cdv__snap"
        aria-label="Resumen del plan frente a tu meta"
      >
        <div class="cdv__snap-kcal">
          <div class="cdv__snap-kcal-main">
            <span class="cdv__snap-kcal-value">
              {{ formatNum(planSnapshot?.calories ?? goalSnapshot?.calories) }}
            </span>
            <span class="cdv__snap-kcal-unit">kcal del plan</span>
          </div>
          <p v-if="goalSnapshot?.calories != null" class="cdv__snap-kcal-meta">
            Meta del entrenador: {{ formatNum(goalSnapshot.calories) }} kcal
          </p>
        </div>
        <div class="cdv__snap-macros" role="list">
          <div
            v-for="row in snapshotMacros"
            :key="row.key"
            class="cdv__snap-row"
            role="listitem"
          >
            <div class="cdv__snap-row-top">
              <span class="cdv__snap-row-label">
                <span class="cdv__snap-dot" :style="{ background: row.color }" />
                {{ row.label }}
              </span>
              <span class="cdv__snap-row-nums">
                <template v-if="row.plan != null && row.goal != null">
                  <strong :style="{ color: row.color }">{{ formatNum(row.plan) }}g</strong>
                  <span class="cdv__snap-muted"> / meta {{ formatNum(row.goal) }}g</span>
                </template>
                <template v-else-if="row.plan != null">
                  <strong :style="{ color: row.color }">{{ formatNum(row.plan) }}g</strong>
                </template>
                <template v-else>
                  <span class="cdv__snap-muted">meta {{ formatNum(row.goal) }}g</span>
                </template>
              </span>
            </div>
            <div
              v-if="row.goal != null && row.plan != null"
              class="cdv__snap-track"
              role="progressbar"
              :aria-valuenow="macroBarPct(row.plan, row.goal)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="row.label + ': ' + formatNum(row.plan) + 'g del plan, meta ' + formatNum(row.goal) + 'g'"
            >
              <div
                class="cdv__snap-fill"
                :style="{
                  width: macroBarPct(row.plan, row.goal) + '%',
                  backgroundColor: row.color,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="compact && nextMeal && isTodayView && !dayEmpty"
        class="cdv__next"
        :class="{
          'cdv__next--celebrate': celebrateMealId === nextMeal.id,
          'cdv__next--done': nextMealStatus === 'eaten',
          'cdv__next--skipped': nextMealStatus === 'skipped',
        }"
      >
        <p class="cdv__next-label">Próxima comida</p>
        <div class="cdv__next-row">
          <span class="cdv__next-icon" aria-hidden="true">
            <v-icon :icon="mealAccent(nextMeal.name).icon" size="22" />
          </span>
          <div class="cdv__next-copy">
            <p class="cdv__next-name">{{ nextMeal.name }}</p>
            <p class="cdv__next-meta">
              <template v-if="nextMeal.time_hint">{{ nextMeal.time_hint }} · </template>
              {{ formatNum(nextMeal.calories) }} kcal
            </p>
          </div>
        </div>

        <p
          v-if="nextMealStatus"
          class="cdv__next-feedback"
          :class="nextMealStatus === 'eaten' ? 'cdv__next-feedback--done' : 'cdv__next-feedback--skip'"
          role="status"
        >
          {{ nextMealStatus === 'eaten'
            ? 'Marcada como cumplida'
            : 'Marcada como saltada' }}
        </p>

        <div
          class="cdv__adhere"
          role="group"
          :aria-label="`¿Cumpliste ${nextMeal.name}?`"
        >
          <button
            type="button"
            class="cdv__adhere-btn"
            :class="{ 'cdv__adhere-btn--on': nextMealStatus === 'eaten' }"
            :disabled="savingMealId === nextMeal.id"
            :aria-pressed="nextMealStatus === 'eaten'"
            @click="setAdherence(nextMeal, 'eaten')"
          >
            <v-icon icon="mdi-check" size="18" />
            Cumplí
          </button>
          <button
            type="button"
            class="cdv__adhere-btn cdv__adhere-btn--skip"
            :class="{ 'cdv__adhere-btn--on': nextMealStatus === 'skipped' }"
            :disabled="savingMealId === nextMeal.id"
            :aria-pressed="nextMealStatus === 'skipped'"
            @click="setAdherence(nextMeal, 'skipped')"
          >
            <v-icon icon="mdi-close" size="18" />
            Salté
          </button>
        </div>
        <button
          type="button"
          class="cdv__expand-toggle"
          :aria-expanded="detailsOpen"
          @click="detailsOpen = !detailsOpen"
        >
          {{ detailsOpen ? 'Ocultar comidas' : 'Ver todas las comidas' }}
          <v-icon
            :icon="detailsOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="18"
          />
        </button>
      </div>

      <div v-show="!compact || detailsOpen || dayEmpty || !isTodayView || !nextMeal">
      <div
        v-if="weekStrip.length"
        class="cdv__strip"
        role="list"
        aria-label="Días de la semana del ciclo"
      >
        <button
          v-for="slot in weekStrip"
          :key="slot.dia"
          type="button"
          class="cdv__strip-day"
          :class="{
            'cdv__strip-day--active': slot.isSelected,
            'cdv__strip-day--today': slot.isResolved,
            'cdv__strip-day--filled': slot.filled,
          }"
          role="listitem"
          :aria-label="`${slot.dia}${slot.filled ? `, ${slot.calories} kcal` : ', sin comidas'}`"
          :aria-pressed="slot.isSelected"
          @click="selectStripDay(slot.dia)"
        >
          <span class="cdv__strip-short">{{ slot.short }}</span>
          <span v-if="slot.filled" class="cdv__strip-kcal">{{ formatNum(slot.calories) }}</span>
          <span v-else class="cdv__strip-empty">—</span>
        </button>
      </div>

      <template v-if="dayEmpty">
        <p class="cdv__empty">
          No hay comidas asignadas para {{ viewingDia }}.
        </p>
      </template>

      <template v-else-if="dayPayload">
        <div v-if="!compact" class="cdv__summary" aria-label="Totales del día">
          <div class="cdv__summary-kcal">
            <span class="cdv__summary-kcal-value">{{ formatNum(dayPayload.calories) }}</span>
            <span class="cdv__summary-kcal-unit">kcal del día</span>
          </div>
          <div class="cdv__summary-macros">
            <div
              v-for="macro in dayMacros"
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

        <p v-if="dayPayload.notes || plan.notes" class="cdv__notes">
          {{ dayPayload.notes || plan.notes }}
        </p>

        <div class="cdv__meals" role="list">
          <article
            v-for="meal in meals"
            :key="meal.id || meal.name"
            class="cdv__meal"
            :style="{ '--meal-accent': mealAccent(meal.name).color }"
            role="listitem"
          >
            <button
              type="button"
              class="cdv__meal-head"
              :aria-expanded="isExpanded(meal.id || meal.name)"
              :aria-controls="`cdv-meal-${meal.id || meal.name}`"
              @click="toggleMeal(meal.id || meal.name)"
            >
              <span class="cdv__meal-icon" aria-hidden="true">
                <v-icon :icon="mealAccent(meal.name).icon" size="20" />
              </span>
              <span class="cdv__meal-copy">
                <span class="cdv__meal-name">{{ meal.name }}</span>
                <span v-if="meal.time_hint" class="cdv__meal-time">{{ meal.time_hint }}</span>
              </span>
              <span
                v-if="isTodayView && mealStatus(meal.id)"
                class="cdv__meal-status"
                :class="`cdv__meal-status--${mealStatus(meal.id)}`"
              >
                {{ mealStatus(meal.id) === 'eaten' ? 'Cumplida' : 'Saltada' }}
              </span>
              <span class="cdv__meal-kcal">{{ formatNum(meal.calories) }} kcal</span>
              <v-icon
                class="cdv__meal-chevron"
                :icon="isExpanded(meal.id || meal.name) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="20"
              />
            </button>

              <div
                v-show="isExpanded(meal.id || meal.name)"
                :id="`cdv-meal-${meal.id || meal.name}`"
                class="cdv__meal-body"
              >
                <ul
                  v-if="Array.isArray(meal.items) && meal.items.length"
                  class="cdv__items"
                >
                <li
                  v-for="item in meal.items"
                  :key="item.id || item.food_name"
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

.cdv__head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cdv__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.cdv__cart-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: -4px -2px -4px 0;
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 12px;
  background: rgba(0, 229, 255, 0.1);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.cdv__cart-btn:hover {
  background: rgba(0, 229, 255, 0.18);
  border-color: rgba(0, 229, 255, 0.55);
}

.cdv__cart-btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.cdv__plan-name {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  font-weight: 650;
  color: #d5dae3;
}

.cdv__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.7rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__empty {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv--locked {
  border-color: rgba(239, 83, 80, 0.35);
}

.cdv__locked {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.35rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba(239, 83, 80, 0.28);
  background: rgba(239, 83, 80, 0.08);
}

.cdv__locked-eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ef5350;
}

.cdv__locked-msg {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
  color: var(--tf-on-surface, #e8eaed);
}

.cdv__strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.3rem;
  margin-bottom: 0.65rem;
}

.cdv__strip-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-height: 44px;
  padding: 0.3rem 0.1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.cdv__strip-day:focus-visible {
  outline: 2px solid rgba(0, 229, 255, 0.55);
  outline-offset: 1px;
}

.cdv__strip-day--filled {
  border-color: rgba(0, 229, 255, 0.25);
}

.cdv__strip-day--today {
  box-shadow: inset 0 -2px 0 rgb(var(--v-theme-primary));
}

.cdv__strip-day--active {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.12);
}

.cdv__strip-short {
  font-size: 0.75rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
}

.cdv__strip-kcal {
  font-size: 0.55rem;
  font-weight: 700;
  color: #d5dae3;
}

.cdv__strip-empty {
  font-size: 0.55rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__item-macro {
  font-weight: 700;
}

.cdv__items-empty {
  margin: 0;
  padding: 0.45rem 0.35rem;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv--highlight {
  border-color: rgba(0, 229, 255, 0.35);
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.12);
}

.cdv__next {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 4px;
  padding: 10px 10px 4px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: box-shadow 0.25s ease;
}

.cdv__next--celebrate {
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.45);
}

.cdv__next-label {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
}

.cdv__next-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cdv__next-icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(0, 229, 255, 0.12);
  color: rgb(var(--v-theme-primary));
}

.cdv__next-copy {
  min-width: 0;
}

.cdv__next-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
}

.cdv__next-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__next-feedback {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__next-feedback--done {
  color: rgb(var(--v-theme-primary));
}

.cdv__next-feedback--skip {
  color: #ffb74d;
}

.cdv__snap {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0.45rem 0 0.55rem;
  padding: 0.7rem 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cdv__snap-kcal-main {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.cdv__snap-kcal-value {
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: rgb(var(--v-theme-primary));
}

.cdv__snap-kcal-unit {
  font-size: 0.72rem;
  font-weight: 650;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__snap-kcal-meta {
  margin: 0.25rem 0 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__snap-macros {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cdv__snap-row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.cdv__snap-row-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--tf-on-surface, #e8eaed);
}

.cdv__snap-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cdv__snap-row-nums {
  font-size: 0.72rem;
  text-align: right;
  color: var(--tf-on-surface, #e8eaed);
}

.cdv__snap-muted {
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-weight: 500;
}

.cdv__snap-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.cdv__snap-fill {
  height: 100%;
  border-radius: inherit;
  min-width: 0;
  transition: width 0.25s ease;
}

.cdv__next--done {
  border-color: rgba(0, 229, 255, 0.35);
}

.cdv__next--skip {
  border-color: rgba(255, 167, 38, 0.4);
}

.cdv__status {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.cdv__status--pending {
  border-color: rgba(0, 229, 255, 0.22);
  background: rgba(0, 229, 255, 0.06);
  color: rgb(var(--v-theme-primary));
}

.cdv__status--done {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.1);
  color: rgb(var(--v-theme-primary));
}

.cdv__status--skip {
  border-color: rgba(255, 167, 38, 0.4);
  background: rgba(255, 167, 38, 0.1);
  color: #ffb74d;
}

.cdv__status-copy {
  min-width: 0;
}

.cdv__status-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 750;
  line-height: 1.25;
  color: inherit;
}

.cdv__status-detail {
  margin: 2px 0 0;
  font-size: 0.7rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cdv__adhere {
  display: flex;
  gap: 8px;
}

.cdv__adhere--inline {
  flex-direction: column;
  margin-bottom: 8px;
  gap: 8px;
}

.cdv__adhere-row {
  display: flex;
  gap: 8px;
}

.cdv__adhere-q {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--tf-on-surface, #e8eaed);
}

.cdv__adhere-hint {
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-align: center;
}

.cdv__adhere--inline .cdv__adhere-hint {
  text-align: left;
}

.cdv__adhere-btn {
  flex: 1;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.cdv__adhere-btn:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.cdv__adhere-btn--on {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.16);
  color: rgb(var(--v-theme-primary));
}

.cdv__adhere-btn--skip.cdv__adhere-btn--on {
  border-color: rgba(255, 167, 38, 0.55);
  background: rgba(255, 167, 38, 0.14);
  color: #ffb74d;
}

.cdv__adhere-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.cdv__expand-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 36px;
  margin: 0 auto;
  padding: 4px 8px;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.cdv__expand-toggle:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.cdv__meal-status {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-primary));
}

.cdv__meal-status--skipped {
  color: #ffb74d;
}
</style>
