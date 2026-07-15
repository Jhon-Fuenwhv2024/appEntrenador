<script setup>
/**
 * Tarjeta cliente: resumen de objetivos nutricionales diarios (solo lectura).
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getClientNutrition } from '../api/nutritionApi.js';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const loading = shallowRef(false);
const loadError = shallowRef('');
const target = shallowRef(null);
const empty = shallowRef(false);

const macros = computed(() => {
  const t = target.value;
  if (!t) return [];
  return [
    {
      key: 'protein',
      label: 'Proteína',
      grams: t.protein_g,
      color: '#EF5350',
      barClass: 'macro-bar--protein',
    },
    {
      key: 'carbs',
      label: 'Carbohidratos',
      grams: t.carbs_g,
      color: '#42A5F5',
      barClass: 'macro-bar--carbs',
    },
    {
      key: 'fats',
      label: 'Grasas',
      grams: t.fats_g,
      color: '#FFCA28',
      barClass: 'macro-bar--fats',
    },
  ];
});

async function loadTarget() {
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
    loadTarget();
  },
);

onMounted(() => {
  loadTarget();
});
</script>

<template>
  <v-card class="macro-summary" variant="flat" rounded="lg">
    <v-card-title class="macro-summary__title">
      <v-icon icon="mdi-food-apple-outline" size="22" class="mr-2" color="primary" />
      Tus Objetivos Diarios
    </v-card-title>

    <v-card-text>
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
        <v-icon icon="mdi-silverware-fork-knife" size="36" color="#8B929E" class="mb-3" />
        <p class="macro-summary__empty-title">
          Tu entrenador aún no ha asignado tus objetivos nutricionales
        </p>
        <p class="macro-summary__empty-desc">
          Cuando los configure, verás aquí tus calorías y macros diarios.
        </p>
      </div>

      <div v-else-if="target" class="macro-summary__body">
        <div class="macro-summary__calories">
          <span class="macro-summary__cal-value">{{ target.calories }}</span>
          <span class="macro-summary__cal-unit">kcal</span>
        </div>
        <p class="macro-summary__cal-label">Calorías objetivo</p>

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
              height="8"
              rounded
              class="macro-summary__bar"
            />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.macro-summary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.macro-summary__title {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  padding-bottom: 0;
}

.macro-summary__empty {
  text-align: center;
  padding: 1.25rem 0.5rem 0.75rem;
}

.macro-summary__empty-title {
  margin: 0 0 0.35rem;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.9);
}

.macro-summary__empty-desc {
  margin: 0;
  font-size: 0.78rem;
  color: #8b929e;
  line-height: 1.4;
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
}

.macro-summary__cal-value {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: rgb(var(--v-theme-primary));
}

.macro-summary__cal-unit {
  font-size: 0.95rem;
  font-weight: 600;
  color: #8b929e;
  text-transform: uppercase;
}

.macro-summary__cal-label {
  margin: 0.35rem 0 1.25rem;
  font-size: 0.75rem;
  color: #8b929e;
}

.macro-summary__macros {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  text-align: left;
}

.macro-summary__row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.macro-summary__macro-label {
  font-size: 0.8rem;
  font-weight: 600;
}

.macro-summary__macro-grams {
  font-size: 0.85rem;
  font-weight: 700;
}

.macro-summary__bar {
  opacity: 0.95;
}
</style>
