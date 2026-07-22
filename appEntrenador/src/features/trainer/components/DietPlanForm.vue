<script setup>
/**
 * Editor de plan de dieta en ciclo multi-semana (Feature 064).
 * Meta + tabs Semana 1…N + strip L–D + builder de comidas del día.
 */
import { computed, reactive, ref, shallowRef, watch } from 'vue';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
  /** Plan existente para editar, o null para crear. */
  initialPlan: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'cancel']);

const UNIT_OPTIONS = ['g', 'ml', 'unidad', 'taza', 'cucharada', 'porción'];
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
const CYCLE_OPTIONS = [
  { title: '2 semanas', value: 2 },
  { title: '3 semanas', value: 3 },
  { title: '4 semanas', value: 4 },
];

function emptyItem() {
  return {
    food_name: '',
    quantity: 100,
    unit: 'g',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
  };
}

function emptyMeal(name = '') {
  return {
    name,
    time_hint: '',
    items: [emptyItem()],
  };
}

function defaultMeals() {
  return [
    emptyMeal('Desayuno'),
    emptyMeal('Almuerzo'),
    emptyMeal('Cena'),
  ];
}

function dayKey(week, dia) {
  return `${week}:${dia}`;
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMondayYmd(ymd) {
  const raw = String(ymd || '').slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return todayYmd();
  const dt = new Date(Date.UTC(y, m - 1, d));
  const jsDay = dt.getUTCDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.toISOString().slice(0, 10);
}

function cloneMeals(meals) {
  return (meals || []).map((meal) => ({
    name: meal.name || '',
    time_hint: meal.time_hint || '',
    items: (meal.items || []).map((item) => ({
      food_name: item.food_name || '',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'g',
      calories: Number(item.calories) || 0,
      protein_g: Number(item.protein_g) || 0,
      carbs_g: Number(item.carbs_g) || 0,
      fats_g: Number(item.fats_g) || 0,
    })),
  }));
}

function createEmptyForm() {
  return {
    title: '',
    notes: '',
    is_active: true,
    cycle_length_weeks: 4,
    cycle_start_date: toMondayYmd(todayYmd()),
  };
}

const form = reactive(createEmptyForm());
/** @type {import('vue').Reactive<Record<string, { notes: string, meals: any[] }>>} */
const daysStore = reactive({});
const activeWeek = ref(1);
const activeDia = ref('Lunes');
const copyDayTarget = ref('Martes');
const copyWeekTarget = ref(2);
const showCopyDay = ref(false);
const showCopyWeek = ref(false);
const formError = shallowRef('');

function ensureDay(week, dia) {
  const key = dayKey(week, dia);
  if (!daysStore[key]) {
    daysStore[key] = {
      notes: '',
      meals: defaultMeals(),
    };
  }
  return daysStore[key];
}

const currentDay = computed(() => ensureDay(activeWeek.value, activeDia.value));

const weekTabs = computed(() => {
  const n = Number(form.cycle_length_weeks) || 4;
  return Array.from({ length: n }, (_, i) => ({
    value: i + 1,
    label: `Semana ${i + 1}`,
  }));
});

function sumMacros(items) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein_g: acc.protein_g + (Number(item.protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(item.carbs_g) || 0),
      fats_g: acc.fats_g + (Number(item.fats_g) || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
  );
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function dayHasFood(entry) {
  return (entry?.meals || []).some((meal) =>
    (meal.items || []).some((item) => String(item.food_name || '').trim()),
  );
}

function dayTotalsFor(entry) {
  const raw = (entry?.meals || []).reduce(
    (acc, meal) => {
      const t = sumMacros(meal.items || []);
      return {
        calories: acc.calories + t.calories,
        protein_g: acc.protein_g + t.protein_g,
        carbs_g: acc.carbs_g + t.carbs_g,
        fats_g: acc.fats_g + t.fats_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
  );
  return {
    calories: round2(raw.calories),
    protein_g: round2(raw.protein_g),
    carbs_g: round2(raw.carbs_g),
    fats_g: round2(raw.fats_g),
  };
}

const dayStrip = computed(() =>
  DAYS.map((dia) => {
    const key = dayKey(activeWeek.value, dia);
    const entry = daysStore[key];
    const filled = dayHasFood(entry);
    const totals = filled ? dayTotalsFor(entry) : null;
    return {
      dia,
      short: DAY_SHORT[dia],
      filled,
      calories: totals?.calories || 0,
      mealCount: filled
        ? (entry.meals || []).filter((m) =>
          (m.items || []).some((i) => String(i.food_name || '').trim()),
        ).length
        : 0,
    };
  }),
);

const mealTotals = computed(() =>
  (currentDay.value.meals || []).map((meal) => {
    const raw = sumMacros(meal.items || []);
    return {
      calories: round2(raw.calories),
      protein_g: round2(raw.protein_g),
      carbs_g: round2(raw.carbs_g),
      fats_g: round2(raw.fats_g),
    };
  }),
);

const selectedDayTotals = computed(() => dayTotalsFor(currentDay.value));

const cycleAverage = computed(() => {
  const filled = Object.values(daysStore).filter((entry) => dayHasFood(entry));
  if (!filled.length) {
    return { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
  }
  const sum = filled.reduce(
    (acc, entry) => {
      const t = dayTotalsFor(entry);
      return {
        calories: acc.calories + t.calories,
        protein_g: acc.protein_g + t.protein_g,
        carbs_g: acc.carbs_g + t.carbs_g,
        fats_g: acc.fats_g + t.fats_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
  );
  const n = filled.length;
  return {
    calories: round2(sum.calories / n),
    protein_g: round2(sum.protein_g / n),
    carbs_g: round2(sum.carbs_g / n),
    fats_g: round2(sum.fats_g / n),
  };
});

function clearDaysStore() {
  Object.keys(daysStore).forEach((key) => {
    delete daysStore[key];
  });
}

function hydrateFromPlan(plan) {
  form.title = plan?.title || '';
  form.notes = plan?.notes || '';
  form.is_active = plan ? Boolean(plan.is_active) : true;
  form.cycle_length_weeks = Number(plan?.cycle_length_weeks) || 4;
  form.cycle_start_date = toMondayYmd(
    plan?.cycle_start_date || todayYmd(),
  );

  clearDaysStore();

  const days = Array.isArray(plan?.days) ? plan.days : [];
  if (days.length) {
    for (const day of days) {
      const week = Number(day.week_index) || 1;
      const dia = DAYS.includes(day.dia_semana) ? day.dia_semana : 'Lunes';
      daysStore[dayKey(week, dia)] = {
        notes: day.notes || '',
        meals: Array.isArray(day.meals) && day.meals.length
          ? cloneMeals(day.meals)
          : defaultMeals(),
      };
    }
    activeWeek.value = Number(days[0].week_index) || 1;
    activeDia.value = DAYS.includes(days[0].dia_semana)
      ? days[0].dia_semana
      : 'Lunes';
  } else if (Array.isArray(plan?.meals) && plan.meals.length) {
    // Legacy shape fallback (pre-064)
    const meals = cloneMeals(plan.meals);
    for (const dia of DAYS) {
      daysStore[dayKey(1, dia)] = {
        notes: '',
        meals: cloneMeals(meals),
      };
    }
    activeWeek.value = 1;
    activeDia.value = 'Lunes';
  } else {
    ensureDay(1, 'Lunes');
    activeWeek.value = 1;
    activeDia.value = 'Lunes';
  }
}

function resetForm() {
  const empty = createEmptyForm();
  form.title = empty.title;
  form.notes = empty.notes;
  form.is_active = empty.is_active;
  form.cycle_length_weeks = empty.cycle_length_weeks;
  form.cycle_start_date = empty.cycle_start_date;
  clearDaysStore();
  ensureDay(1, 'Lunes');
  activeWeek.value = 1;
  activeDia.value = 'Lunes';
  formError.value = '';
}

function selectDay(dia) {
  activeDia.value = dia;
  ensureDay(activeWeek.value, dia);
  formError.value = '';
}

function selectWeek(week) {
  activeWeek.value = week;
  ensureDay(week, activeDia.value);
  formError.value = '';
  if (copyWeekTarget.value === week) {
    copyWeekTarget.value = week === 1 ? 2 : 1;
  }
}

function addMeal() {
  currentDay.value.meals.push(
    emptyMeal(`Comida ${currentDay.value.meals.length + 1}`),
  );
}

function removeMeal(mealIndex) {
  if (currentDay.value.meals.length <= 1) return;
  currentDay.value.meals.splice(mealIndex, 1);
}

function addItem(mealIndex) {
  currentDay.value.meals[mealIndex].items.push(emptyItem());
}

function removeItem(mealIndex, itemIndex) {
  const items = currentDay.value.meals[mealIndex].items;
  if (items.length <= 1) return;
  items.splice(itemIndex, 1);
}

function moveMeal(mealIndex, delta) {
  const target = mealIndex + delta;
  if (target < 0 || target >= currentDay.value.meals.length) return;
  const [meal] = currentDay.value.meals.splice(mealIndex, 1);
  currentDay.value.meals.splice(target, 0, meal);
}

function clearCurrentDay() {
  const ok = window.confirm(
    `¿Limpiar comidas de Semana ${activeWeek.value} · ${activeDia.value}?`,
  );
  if (!ok) return;
  const key = dayKey(activeWeek.value, activeDia.value);
  daysStore[key] = {
    notes: '',
    meals: defaultMeals(),
  };
}

function applyCopyDay() {
  const fromKey = dayKey(activeWeek.value, activeDia.value);
  const toDia = copyDayTarget.value;
  if (!DAYS.includes(toDia) || toDia === activeDia.value) {
    showCopyDay.value = false;
    return;
  }
  const source = daysStore[fromKey];
  if (!source || !dayHasFood(source)) {
    showCopyDay.value = false;
    return;
  }
  daysStore[dayKey(activeWeek.value, toDia)] = {
    notes: source.notes || '',
    meals: cloneMeals(source.meals),
  };
  showCopyDay.value = false;
  activeDia.value = toDia;
}

function applyCopyWeek() {
  const fromWeek = activeWeek.value;
  const toWeek = Number(copyWeekTarget.value);
  const max = Number(form.cycle_length_weeks) || 4;
  if (!Number.isInteger(toWeek) || toWeek < 1 || toWeek > max || toWeek === fromWeek) {
    showCopyWeek.value = false;
    return;
  }
  for (const dia of DAYS) {
    const source = daysStore[dayKey(fromWeek, dia)];
    if (!source || !dayHasFood(source)) continue;
    daysStore[dayKey(toWeek, dia)] = {
      notes: source.notes || '',
      meals: cloneMeals(source.meals),
    };
  }
  showCopyWeek.value = false;
  activeWeek.value = toWeek;
}

function buildPayload() {
  const days = [];
  for (const [key, entry] of Object.entries(daysStore)) {
    if (!dayHasFood(entry)) continue;
    const [weekStr, ...diaParts] = key.split(':');
    const week_index = Number(weekStr);
    const dia_semana = diaParts.join(':');
    if (!DAYS.includes(dia_semana)) continue;

    days.push({
      week_index,
      dia_semana,
      notes: entry.notes?.trim() || null,
      meals: (entry.meals || []).map((meal, mealIndex) => {
        const mealName = String(meal.name || '').trim() || `Comida ${mealIndex + 1}`;
        return {
          name: mealName,
          sort_order: mealIndex,
          time_hint: meal.time_hint?.trim() || null,
          items: (meal.items || [])
            .filter((item) => String(item.food_name || '').trim())
            .map((item, itemIndex) => ({
              food_name: item.food_name.trim(),
              quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
              unit: item.unit || 'g',
              calories: Number(item.calories) || 0,
              protein_g: Number(item.protein_g) || 0,
              carbs_g: Number(item.carbs_g) || 0,
              fats_g: Number(item.fats_g) || 0,
              sort_order: itemIndex,
            })),
        };
      }).filter((meal) => meal.items.length > 0),
    });
  }

  return {
    client_id: props.clientId,
    title: form.title.trim(),
    notes: form.notes?.trim() || null,
    is_active: Boolean(form.is_active),
    cycle_length_weeks: Number(form.cycle_length_weeks) || 4,
    cycle_start_date: toMondayYmd(form.cycle_start_date),
    days,
  };
}

/**
 * Lista días del ciclo sin alimentos (para mensajes claros).
 */
function listEmptyCycleSlots() {
  const weeks = Number(form.cycle_length_weeks) || 4;
  const empty = [];
  for (let week = 1; week <= weeks; week += 1) {
    for (const dia of DAYS) {
      const entry = daysStore[dayKey(week, dia)];
      if (!dayHasFood(entry)) {
        empty.push(`Semana ${week} · ${dia}`);
      }
    }
  }
  return empty;
}

/**
 * Valida antes de enviar y navega al día problemático.
 * @returns {string|null} mensaje de error o null si OK
 */
function validateBeforeSubmit() {
  if (!form.title.trim()) {
    return 'El título del plan es obligatorio.';
  }

  const current = ensureDay(activeWeek.value, activeDia.value);
  for (let mealIndex = 0; mealIndex < (current.meals || []).length; mealIndex += 1) {
    const meal = current.meals[mealIndex];
    const mealName = String(meal.name || '').trim() || `Comida #${mealIndex + 1}`;
    const hasBlankFoodWithData = (meal.items || []).some(
      (item) => !String(item.food_name || '').trim()
        && (Number(item.calories) > 0
          || Number(item.protein_g) > 0
          || Number(item.carbs_g) > 0
          || Number(item.fats_g) > 0
          || Number(item.quantity) > 0),
    );
    if (hasBlankFoodWithData) {
      return (
        `Semana ${activeWeek.value} · ${activeDia.value} · ${mealName}: `
        + `escribe el nombre del alimento (hay cantidad/macros sin nombre).`
      );
    }
  }

  const filled = Object.entries(daysStore).filter(([, entry]) => dayHasFood(entry));
  if (!filled.length) {
    const empty = listEmptyCycleSlots();
    const preview = empty.slice(0, 3).join('; ');
    const more = empty.length > 3 ? ` (+${empty.length - 3} más)` : '';
    return (
      `Ningún día tiene alimentos con nombre. `
      + `Estás en Semana ${activeWeek.value} · ${activeDia.value}. `
      + `Vacíos: ${preview}${more}. `
      + `Escribe el nombre del alimento (ej. “Ensalada de frutas”) en al menos un día.`
    );
  }

  for (const [key, entry] of Object.entries(daysStore)) {
    if (dayHasFood(entry)) continue;
    const touchedMacros = (entry.meals || []).some((m) =>
      (m.items || []).some(
        (item) => Number(item.calories) > 0
          || Number(item.protein_g) > 0
          || Number(item.carbs_g) > 0
          || Number(item.fats_g) > 0,
      ),
    );
    if (!touchedMacros) continue;

    const [weekStr, ...diaParts] = key.split(':');
    const week = Number(weekStr);
    const dia = diaParts.join(':');
    if (!DAYS.includes(dia)) continue;

    activeWeek.value = week;
    activeDia.value = dia;
    ensureDay(week, dia);

    const firstMeal = (entry.meals || []).find((m) =>
      (m.items || []).some(
        (item) => Number(item.calories) > 0 || Number(item.protein_g) > 0,
      ),
    ) || entry.meals?.[0];
    const mealName = String(firstMeal?.name || '').trim() || 'una comida';
    return (
      `Semana ${week} · ${dia} · ${mealName}: falta el nombre del alimento. `
      + `Rellena “Alimento” o usa “Limpiar día” si no quieres ese día.`
    );
  }

  return null;
}

function onSubmit() {
  formError.value = '';
  const error = validateBeforeSubmit();
  if (error) {
    formError.value = error;
    return;
  }
  const payload = buildPayload();
  if (!payload.days.length) {
    const empty = listEmptyCycleSlots();
    formError.value = (
      `No se envió ningún día con alimentos. `
      + `Revisa: ${empty.slice(0, 5).join('; ')}${empty.length > 5 ? '…' : ''}.`
    );
    return;
  }
  emit('submit', payload);
}

const copyDayOptions = computed(() =>
  DAYS.filter((d) => d !== activeDia.value),
);

const copyWeekOptions = computed(() => {
  const n = Number(form.cycle_length_weeks) || 4;
  return Array.from({ length: n }, (_, i) => i + 1).filter(
    (w) => w !== activeWeek.value,
  );
});

watch(
  () => form.cycle_length_weeks,
  (weeks) => {
    const n = Number(weeks) || 4;
    if (activeWeek.value > n) {
      activeWeek.value = n;
    }
    if (copyWeekTarget.value > n || copyWeekTarget.value === activeWeek.value) {
      copyWeekTarget.value = n === activeWeek.value ? Math.max(1, n - 1) : n;
    }
  },
);

watch(
  () => props.initialPlan,
  (plan) => {
    if (plan) {
      hydrateFromPlan(plan);
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

defineExpose({ resetForm, buildPayload });
</script>

<template>
  <v-form class="dpf" @submit.prevent="onSubmit">
    <v-row dense>
      <v-col cols="12" sm="7">
        <v-text-field
          v-model="form.title"
          label="Título del plan"
          density="compact"
          variant="outlined"
          hide-details="auto"
          color="primary"
          required
        />
      </v-col>
      <v-col cols="6" sm="3">
        <v-select
          v-model="form.cycle_length_weeks"
          :items="CYCLE_OPTIONS"
          item-title="title"
          item-value="value"
          label="Duración ciclo"
          density="compact"
          variant="outlined"
          hide-details="auto"
          color="primary"
          :menu-props="{ contentClass: 'tf-overlay-menu' }"
          :list-props="{ bgColor: 'surface' }"
        />
      </v-col>
      <v-col cols="6" sm="2">
        <v-text-field
          v-model="form.cycle_start_date"
          label="Inicio (lun)"
          type="date"
          density="compact"
          variant="outlined"
          hide-details="auto"
          color="primary"
          @blur="form.cycle_start_date = toMondayYmd(form.cycle_start_date)"
        />
      </v-col>
      <v-col cols="12" sm="8">
        <v-textarea
          v-model="form.notes"
          label="Notas (opcional)"
          density="compact"
          variant="outlined"
          rows="2"
          hide-details="auto"
          color="primary"
          auto-grow
        />
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-center">
        <v-switch
          v-model="form.is_active"
          label="Activar y sincronizar objetivos (media del ciclo)"
          color="primary"
          density="compact"
          hide-details
          class="dpf__switch"
        />
      </v-col>
    </v-row>

    <div class="dpf__totals" aria-live="polite">
      <div class="dpf__totals-block">
        <span class="dpf__totals-label">Media del ciclo</span>
        <div class="dpf__chips">
          <span class="dpf__chip dpf__chip--kcal">{{ cycleAverage.calories }} kcal</span>
          <span class="dpf__chip">P {{ cycleAverage.protein_g }}g</span>
          <span class="dpf__chip">C {{ cycleAverage.carbs_g }}g</span>
          <span class="dpf__chip">G {{ cycleAverage.fats_g }}g</span>
        </div>
      </div>
      <div class="dpf__totals-block">
        <span class="dpf__totals-label">Día seleccionado</span>
        <div class="dpf__chips">
          <span class="dpf__chip">{{ selectedDayTotals.calories }} kcal</span>
          <span class="dpf__chip">P {{ selectedDayTotals.protein_g }}g</span>
          <span class="dpf__chip">C {{ selectedDayTotals.carbs_g }}g</span>
          <span class="dpf__chip">G {{ selectedDayTotals.fats_g }}g</span>
        </div>
      </div>
    </div>

    <v-alert
      v-if="formError"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
      prominent
    >
      {{ formError }}
    </v-alert>

    <div class="dpf__weeks" role="tablist" aria-label="Semanas del ciclo">
      <button
        v-for="tab in weekTabs"
        :key="tab.value"
        type="button"
        class="dpf__week-tab"
        :class="{ 'dpf__week-tab--active': activeWeek === tab.value }"
        role="tab"
        :aria-selected="activeWeek === tab.value"
        @click="selectWeek(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="dpf__strip" role="list" aria-label="Días de la semana">
      <button
        v-for="slot in dayStrip"
        :key="slot.dia"
        type="button"
        class="dpf__day"
        :class="{
          'dpf__day--active': activeDia === slot.dia,
          'dpf__day--filled': slot.filled,
        }"
        role="listitem"
        :aria-label="`${slot.dia}${slot.filled ? `, ${slot.calories} kcal` : ', vacío'}`"
        :aria-pressed="activeDia === slot.dia"
        @click="selectDay(slot.dia)"
      >
        <span class="dpf__day-short">{{ slot.short }}</span>
        <span class="dpf__day-name">{{ slot.dia.slice(0, 3) }}</span>
        <span v-if="slot.filled" class="dpf__day-kcal">{{ slot.calories }}</span>
        <span v-else class="dpf__day-empty">—</span>
      </button>
    </div>

    <div class="dpf__day-toolbar">
      <p class="dpf__day-title">
        Semana {{ activeWeek }} · {{ activeDia }}
      </p>
      <div class="dpf__day-actions">
        <v-btn
          size="x-small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-content-copy"
          @click="showCopyDay = true"
        >
          Duplicar día
        </v-btn>
        <v-btn
          size="x-small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-calendar-week"
          @click="showCopyWeek = true"
        >
          Duplicar semana
        </v-btn>
        <v-btn
          size="x-small"
          variant="text"
          color="error"
          @click="clearCurrentDay"
        >
          Limpiar día
        </v-btn>
      </div>
    </div>

    <v-card
      v-for="(meal, mealIndex) in currentDay.meals"
      :key="`${activeWeek}-${activeDia}-${mealIndex}`"
      class="dpf__meal"
      variant="outlined"
    >
      <v-card-title class="dpf__meal-head">
        <v-text-field
          v-model="meal.name"
          label="Nombre de la comida"
          density="compact"
          variant="outlined"
          hide-details
          color="primary"
          class="dpf__meal-name"
        />
        <v-text-field
          v-model="meal.time_hint"
          label="Hora"
          placeholder="08:00"
          density="compact"
          variant="outlined"
          hide-details
          color="primary"
          class="dpf__meal-time"
        />
        <div class="dpf__meal-actions">
          <v-btn
            icon="mdi-arrow-up"
            size="x-small"
            variant="text"
            :disabled="mealIndex === 0"
            aria-label="Subir comida"
            @click="moveMeal(mealIndex, -1)"
          />
          <v-btn
            icon="mdi-arrow-down"
            size="x-small"
            variant="text"
            :disabled="mealIndex === currentDay.meals.length - 1"
            aria-label="Bajar comida"
            @click="moveMeal(mealIndex, 1)"
          />
          <v-btn
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            color="error"
            :disabled="currentDay.meals.length <= 1"
            aria-label="Eliminar comida"
            @click="removeMeal(mealIndex)"
          />
        </div>
      </v-card-title>

      <v-card-text>
        <div class="dpf__meal-totals">
          <span>{{ mealTotals[mealIndex].calories }} kcal</span>
          <span>P {{ mealTotals[mealIndex].protein_g }}g</span>
          <span>C {{ mealTotals[mealIndex].carbs_g }}g</span>
          <span>G {{ mealTotals[mealIndex].fats_g }}g</span>
        </div>

        <div
          v-for="(item, itemIndex) in meal.items"
          :key="itemIndex"
          class="dpf__item"
        >
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="item.food_name"
                label="Alimento"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
              />
            </v-col>
            <v-col cols="4" sm="2">
              <v-text-field
                v-model.number="item.quantity"
                label="Cant."
                type="number"
                min="0"
                step="0.1"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
              />
            </v-col>
            <v-col cols="4" sm="2">
              <v-select
                v-model="item.unit"
                :items="UNIT_OPTIONS"
                label="Unidad"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
                :menu-props="{ contentClass: 'tf-overlay-menu' }"
                :list-props="{ bgColor: 'surface' }"
              />
            </v-col>
            <v-col cols="4" sm="1">
              <v-text-field
                v-model.number="item.calories"
                label="kcal"
                type="number"
                min="0"
                step="1"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
              />
            </v-col>
            <v-col cols="4" sm="1">
              <v-text-field
                v-model.number="item.protein_g"
                label="P"
                type="number"
                min="0"
                step="0.1"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
              />
            </v-col>
            <v-col cols="4" sm="1">
              <v-text-field
                v-model.number="item.carbs_g"
                label="C"
                type="number"
                min="0"
                step="0.1"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
              />
            </v-col>
            <v-col cols="3" sm="1">
              <v-text-field
                v-model.number="item.fats_g"
                label="G"
                type="number"
                min="0"
                step="0.1"
                density="compact"
                variant="outlined"
                hide-details="auto"
                color="primary"
              />
            </v-col>
            <v-col cols="1" class="d-flex align-center justify-center">
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                :disabled="meal.items.length <= 1"
                aria-label="Quitar alimento"
                @click="removeItem(mealIndex, itemIndex)"
              />
            </v-col>
          </v-row>
        </div>

        <v-btn
          variant="tonal"
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          class="mt-2"
          @click="addItem(mealIndex)"
        >
          Añadir Alimento
        </v-btn>
      </v-card-text>
    </v-card>

    <div class="dpf__footer">
      <v-btn
        variant="outlined"
        color="primary"
        size="small"
        prepend-icon="mdi-food"
        @click="addMeal"
      >
        Añadir Comida
      </v-btn>

      <div class="dpf__footer-actions">
        <v-btn
          variant="text"
          size="small"
          :disabled="saving"
          @click="emit('cancel')"
        >
          Cancelar
        </v-btn>
        <v-btn
          type="submit"
          color="primary"
          size="small"
          class="font-weight-bold"
          :loading="saving"
        >
          {{ initialPlan ? 'Guardar cambios' : 'Crear plan' }}
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="showCopyDay" max-width="360">
      <v-card>
        <v-card-title class="text-body-1 font-weight-bold">
          Duplicar {{ activeDia }} →
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="copyDayTarget"
            :items="copyDayOptions"
            label="Día destino (misma semana)"
            density="compact"
            variant="outlined"
            color="primary"
            :menu-props="{ contentClass: 'tf-overlay-menu' }"
            :list-props="{ bgColor: 'surface' }"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCopyDay = false">Cancelar</v-btn>
          <v-btn color="primary" class="font-weight-bold" @click="applyCopyDay">
            Duplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showCopyWeek" max-width="360">
      <v-card>
        <v-card-title class="text-body-1 font-weight-bold">
          Duplicar Semana {{ activeWeek }} →
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="copyWeekTarget"
            :items="copyWeekOptions"
            label="Semana destino"
            density="compact"
            variant="outlined"
            color="primary"
            :menu-props="{ contentClass: 'tf-overlay-menu' }"
            :list-props="{ bgColor: 'surface' }"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCopyWeek = false">Cancelar</v-btn>
          <v-btn color="primary" class="font-weight-bold" @click="applyCopyWeek">
            Duplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<style scoped>
.dpf {
  margin-top: 0.5rem;
}

.dpf__switch {
  margin-top: 0;
}

.dpf__totals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  margin: 0.85rem 0 0.75rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.18);
}

.dpf__totals-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.65rem;
}

.dpf__totals-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dpf__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dpf__chip {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
}

.dpf__chip--kcal {
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.dpf__weeks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.55rem;
}

.dpf__week-tab {
  min-height: 36px;
  min-width: 44px;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
}

.dpf__week-tab:focus-visible {
  outline: 2px solid rgba(0, 229, 255, 0.55);
  outline-offset: 2px;
}

.dpf__week-tab--active {
  border-color: rgba(0, 229, 255, 0.45);
  background: rgba(0, 229, 255, 0.14);
  color: rgb(var(--v-theme-primary));
}

.dpf__strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.3rem;
  margin-bottom: 0.65rem;
}

.dpf__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-height: 52px;
  padding: 0.35rem 0.15rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.dpf__day:focus-visible {
  outline: 2px solid rgba(0, 229, 255, 0.55);
  outline-offset: 1px;
}

.dpf__day--filled {
  border-color: rgba(0, 229, 255, 0.28);
}

.dpf__day--active {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.12);
}

.dpf__day-short {
  font-size: 0.78rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
}

.dpf__day-name {
  font-size: 0.58rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: uppercase;
}

.dpf__day-kcal {
  font-size: 0.58rem;
  font-weight: 700;
  color: #d5dae3;
}

.dpf__day-empty {
  font-size: 0.58rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dpf__day-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}

.dpf__day-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
}

.dpf__day-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.dpf__meal {
  margin-bottom: 0.75rem;
  background: rgba(255, 255, 255, 0.02) !important;
}

.dpf__meal-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding-bottom: 0.25rem;
}

.dpf__meal-name {
  flex: 1 1 10rem;
  min-width: 8rem;
}

.dpf__meal-time {
  flex: 0 1 6rem;
  max-width: 7rem;
}

.dpf__meal-actions {
  display: flex;
  gap: 0.1rem;
}

.dpf__meal-totals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dpf__item {
  margin-bottom: 0.45rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.dpf__item:last-of-type {
  border-bottom: none;
}

.dpf__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin-top: 0.5rem;
}

.dpf__footer-actions {
  display: flex;
  gap: 0.35rem;
  margin-left: auto;
}

@media (max-width: 420px) {
  .dpf__day-name {
    display: none;
  }
}
</style>
