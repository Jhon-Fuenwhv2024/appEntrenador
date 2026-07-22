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
      short: 'P',
      label: 'Proteína',
      grams: t.protein_g,
      color: '#EF5350',
    },
    {
      key: 'carbs',
      short: 'C',
      label: 'Carbohidratos',
      grams: t.carbs_g,
      color: '#42A5F5',
    },
    {
      key: 'fats',
      short: 'G',
      label: 'Grasas',
      grams: t.fats_g,
      color: '#FFCA28',
    },
  ];
});

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
        <div class="macro-summary__compact-head">
          <div class="macro-summary__compact-titles">
            <p class="macro-summary__compact-title">
              <v-icon icon="mdi-food-apple-outline" size="16" color="primary" class="mr-1" />
              Nutrición
            </p>
            <p class="macro-summary__compact-hint">
              Objetivos diarios de tu entrenador
            </p>
          </div>
          <div class="macro-summary__kcal">
            <span class="macro-summary__kcal-value">{{ target.calories }}</span>
            <span class="macro-summary__kcal-unit">kcal/día</span>
          </div>
        </div>
        <div class="macro-summary__chips">
          <span
            v-for="macro in macros"
            :key="macro.key"
            class="macro-summary__chip"
          >
            <span class="macro-summary__chip-dot" :style="{ background: macro.color }" />
            <span class="macro-summary__chip-label">{{ macro.label }}</span>
            <span class="macro-summary__chip-grams" :style="{ color: macro.color }">
              {{ macro.grams }}g
            </span>
          </span>
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
  gap: 8px;
  padding: 10px 12px;
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
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.macro-summary__compact-hint {
  margin: 2px 0 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.3;
}

.macro-summary__kcal {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex-shrink: 0;
}

.macro-summary__kcal-value {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}

.macro-summary__kcal-unit {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: uppercase;
}

.macro-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
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
