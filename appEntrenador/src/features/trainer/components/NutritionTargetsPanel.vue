<script setup>
/**
 * Panel trainer: asignar / editar objetivos nutricionales diarios (macros + calorías).
 * Auto-cálculo Atwater (FDA/USDA): kcal = P×4 + C×4 + F×9; override manual permitido.
 */
import { nextTick, onMounted, reactive, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { caloriesFromMacros, toPositiveInt } from '../../../shared/nutrition/macros.js';
import { getClientNutrition, upsertClientNutrition } from '../api/nutritionApi.js';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify']);

const loading = shallowRef(false);
const saving = shallowRef(false);
const loadError = shallowRef('');
const hasTarget = shallowRef(false);
/** Evita recalcular al hidratar desde API. */
const hydrating = shallowRef(false);

const form = reactive({
  protein_g: null,
  carbs_g: null,
  fats_g: null,
  calories: null,
});

function resetForm() {
  hydrating.value = true;
  form.protein_g = null;
  form.carbs_g = null;
  form.fats_g = null;
  form.calories = null;
  hasTarget.value = false;
  nextTick(() => {
    hydrating.value = false;
  });
}

function applyTarget(data) {
  hydrating.value = true;
  form.protein_g = Number(data.protein_g);
  form.carbs_g = Number(data.carbs_g);
  form.fats_g = Number(data.fats_g);
  form.calories = Number(data.calories);
  hasTarget.value = true;
  nextTick(() => {
    hydrating.value = false;
  });
}

async function loadTarget() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getClientNutrition(props.clientId);
    const data = response.data?.data ?? null;
    if (data) {
      applyTarget(data);
    } else {
      resetForm();
    }
  } catch (error) {
    // Compat: backends antiguos devolvían 404 cuando no había plan.
    const code = error?.normalized?.code || error?.response?.status;
    if (code === 404) {
      resetForm();
      loadError.value = '';
      return;
    }
    console.error('Error cargando objetivos nutricionales:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar los objetivos');
    resetForm();
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  const protein_g = toPositiveInt(form.protein_g);
  const carbs_g = toPositiveInt(form.carbs_g);
  const fats_g = toPositiveInt(form.fats_g);
  let calories = toPositiveInt(form.calories);

  if (protein_g == null || carbs_g == null || fats_g == null) {
    emit('notify', {
      text: 'Proteína, carbohidratos y grasas deben ser enteros ≥ 1',
      color: 'warning',
    });
    return;
  }

  // Si calorías vacías/ inválidas, recalcular con Atwater antes de enviar.
  if (calories == null) {
    calories = caloriesFromMacros(protein_g, carbs_g, fats_g);
    form.calories = calories;
  }

  if (calories < 1) {
    emit('notify', {
      text: 'Las calorías deben ser un entero ≥ 1',
      color: 'warning',
    });
    return;
  }

  const payload = { protein_g, carbs_g, fats_g, calories };

  try {
    saving.value = true;
    const response = await upsertClientNutrition(props.clientId, payload);
    applyTarget(response.data.data);
    emit('notify', { text: 'Objetivos nutricionales guardados', color: 'success' });
  } catch (error) {
    console.error('Error guardando objetivos nutricionales:', error);
    const msg = getApiErrorMessage(error, 'No se pudieron guardar los objetivos');
    emit('notify', { text: msg, color: 'error' });
  } finally {
    saving.value = false;
  }
}

watch(
  () => [form.protein_g, form.carbs_g, form.fats_g],
  () => {
    if (hydrating.value) return;
    const estimated = caloriesFromMacros(form.protein_g, form.carbs_g, form.fats_g);
    if (estimated > 0) {
      form.calories = estimated;
    }
  },
);

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
  <div class="ntp">
    <div class="ntp__head">
      <div class="min-w-0">
        <h3 class="ntp__title">Objetivos Nutricionales</h3>
        <p class="ntp__hint">
          {{
            hasTarget
              ? 'Meta diaria asignada (editable sin plan de comidas)'
              : 'Sin meta aún — puedes guardar objetivos sin crear un plan de comidas'
          }}
        </p>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" height="2" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" density="compact" class="mb-2">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadTarget">Reintentar</v-btn>
      </template>
    </v-alert>

    <v-form v-else class="ntp__form" @submit.prevent="onSave">
      <v-row dense>
        <v-col cols="6">
          <v-text-field
            v-model.number="form.protein_g"
            label="Proteína (g)"
            type="number"
            min="1"
            step="1"
            density="compact"
            variant="outlined"
            hide-details="auto"
            color="primary"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model.number="form.carbs_g"
            label="Carbs (g)"
            type="number"
            min="1"
            step="1"
            density="compact"
            variant="outlined"
            hide-details="auto"
            color="primary"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model.number="form.fats_g"
            label="Grasas (g)"
            type="number"
            min="1"
            step="1"
            density="compact"
            variant="outlined"
            hide-details="auto"
            color="primary"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model.number="form.calories"
            label="Calorías (kcal)"
            type="number"
            min="1"
            step="1"
            density="compact"
            variant="outlined"
            hide-details="auto"
            color="primary"
            hint="Atwater: P×4 + C×4 + F×9"
            persistent-hint
          />
        </v-col>
      </v-row>

      <v-btn
        type="submit"
        color="primary"
        class="font-weight-bold mt-3"
        block
        size="small"
        :loading="saving"
        :disabled="loading"
      >
        Guardar objetivos
      </v-btn>
    </v-form>
  </div>
</template>

<style scoped>
.ntp {
  margin-top: 1rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ntp__head {
  margin-bottom: 0.65rem;
}

.ntp__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.ntp__hint {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: #8b929e;
}

.ntp__form {
  margin-top: 0.25rem;
}
</style>
