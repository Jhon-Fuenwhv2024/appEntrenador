<script setup>
/**
 * Formulario anidado Plan → Comidas → Alimentos.
 * Totales de macros en vivo vía computed (capa FE); el backend recalcula al guardar.
 */
import { computed, reactive, watch } from 'vue';

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

function createEmptyForm() {
  return {
    title: '',
    notes: '',
    is_active: true,
    meals: [
      emptyMeal('Desayuno'),
      emptyMeal('Almuerzo'),
      emptyMeal('Cena'),
    ],
  };
}

const form = reactive(createEmptyForm());

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

/** Totales por comida (índice) — reaccionan a cambios en items. */
const mealTotals = computed(() =>
  form.meals.map((meal) => {
    const raw = sumMacros(meal.items || []);
    return {
      calories: round2(raw.calories),
      protein_g: round2(raw.protein_g),
      carbs_g: round2(raw.carbs_g),
      fats_g: round2(raw.fats_g),
    };
  }),
);

/** Gran total del plan. */
const planTotals = computed(() => {
  const raw = mealTotals.value.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein_g: acc.protein_g + meal.protein_g,
      carbs_g: acc.carbs_g + meal.carbs_g,
      fats_g: acc.fats_g + meal.fats_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
  );
  return {
    calories: round2(raw.calories),
    protein_g: round2(raw.protein_g),
    carbs_g: round2(raw.carbs_g),
    fats_g: round2(raw.fats_g),
  };
});

function hydrateFromPlan(plan) {
  form.title = plan?.title || '';
  form.notes = plan?.notes || '';
  form.is_active = plan ? Boolean(plan.is_active) : true;
  form.meals = Array.isArray(plan?.meals) && plan.meals.length
    ? plan.meals.map((meal) => ({
        name: meal.name || '',
        time_hint: meal.time_hint || '',
        items: Array.isArray(meal.items) && meal.items.length
          ? meal.items.map((item) => ({
              food_name: item.food_name || '',
              quantity: Number(item.quantity) || 1,
              unit: item.unit || 'g',
              calories: Number(item.calories) || 0,
              protein_g: Number(item.protein_g) || 0,
              carbs_g: Number(item.carbs_g) || 0,
              fats_g: Number(item.fats_g) || 0,
            }))
          : [emptyItem()],
      }))
    : createEmptyForm().meals;
}

function resetForm() {
  const empty = createEmptyForm();
  form.title = empty.title;
  form.notes = empty.notes;
  form.is_active = empty.is_active;
  form.meals = empty.meals;
}

function addMeal() {
  form.meals.push(emptyMeal(`Comida ${form.meals.length + 1}`));
}

function removeMeal(mealIndex) {
  if (form.meals.length <= 1) return;
  form.meals.splice(mealIndex, 1);
}

function addItem(mealIndex) {
  form.meals[mealIndex].items.push(emptyItem());
}

function removeItem(mealIndex, itemIndex) {
  const items = form.meals[mealIndex].items;
  if (items.length <= 1) return;
  items.splice(itemIndex, 1);
}

function moveMeal(mealIndex, delta) {
  const target = mealIndex + delta;
  if (target < 0 || target >= form.meals.length) return;
  const [meal] = form.meals.splice(mealIndex, 1);
  form.meals.splice(target, 0, meal);
}

function buildPayload() {
  return {
    client_id: props.clientId,
    title: form.title.trim(),
    notes: form.notes?.trim() || null,
    is_active: Boolean(form.is_active),
    meals: form.meals.map((meal, mealIndex) => ({
      name: meal.name.trim(),
      sort_order: mealIndex,
      time_hint: meal.time_hint?.trim() || null,
      items: (meal.items || []).map((item, itemIndex) => ({
        food_name: item.food_name.trim(),
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'g',
        calories: Number(item.calories) || 0,
        protein_g: Number(item.protein_g) || 0,
        carbs_g: Number(item.carbs_g) || 0,
        fats_g: Number(item.fats_g) || 0,
        sort_order: itemIndex,
      })),
    })),
  };
}

function onSubmit() {
  emit('submit', buildPayload());
}

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
      <v-col cols="12" sm="8">
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
      <v-col cols="12" sm="4" class="d-flex align-center">
        <v-switch
          v-model="form.is_active"
          label="Activar y sincronizar objetivos diarios"
          color="primary"
          density="compact"
          hide-details
          class="dpf__switch"
        />
      </v-col>
      <v-col cols="12">
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
    </v-row>

    <div class="dpf__totals" aria-live="polite">
      <span class="dpf__totals-label">Total del plan</span>
      <div class="dpf__chips">
        <span class="dpf__chip dpf__chip--kcal">{{ planTotals.calories }} kcal</span>
        <span class="dpf__chip">P {{ planTotals.protein_g }}g</span>
        <span class="dpf__chip">C {{ planTotals.carbs_g }}g</span>
        <span class="dpf__chip">G {{ planTotals.fats_g }}g</span>
      </div>
    </div>

    <v-card
      v-for="(meal, mealIndex) in form.meals"
      :key="mealIndex"
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
            :disabled="mealIndex === form.meals.length - 1"
            aria-label="Bajar comida"
            @click="moveMeal(mealIndex, 1)"
          />
          <v-btn
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            color="error"
            :disabled="form.meals.length <= 1"
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
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin: 0.85rem 0 0.75rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.18);
}

.dpf__totals-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8b929e;
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
  color: #8b929e;
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
</style>
