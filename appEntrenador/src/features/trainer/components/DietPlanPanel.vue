<script setup>
/**
 * Panel Client 360: listar / crear / editar / activar / eliminar planes de dieta.
 */
import { onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  activateDietPlan,
  createDietPlan,
  deleteDietPlan,
  listDietPlans,
  updateDietPlan,
} from '../api/dietPlansApi.js';
import DietPlanForm from './DietPlanForm.vue';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify', 'targets-synced']);

const loading = shallowRef(false);
const saving = shallowRef(false);
const loadError = shallowRef('');
const plans = shallowRef([]);
const showForm = shallowRef(false);
const editingPlan = shallowRef(null);
const deletingId = shallowRef(null);
const activatingId = shallowRef(null);

async function loadPlans() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await listDietPlans(props.clientId);
    plans.value = response.data?.data ?? [];
  } catch (error) {
    console.error('Error cargando planes de dieta:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar los planes de dieta');
    plans.value = [];
  } finally {
    loading.value = false;
  }
}

function startCreate() {
  editingPlan.value = null;
  showForm.value = true;
}

function startEdit(plan) {
  editingPlan.value = plan;
  showForm.value = true;
}

function cancelForm() {
  showForm.value = false;
  editingPlan.value = null;
}

async function onSubmit(payload) {
  try {
    saving.value = true;
    const wasActive = Boolean(payload?.is_active);
    if (editingPlan.value?.id) {
      await updateDietPlan(editingPlan.value.id, payload);
      emit('notify', {
        text: wasActive
          ? 'Plan guardado y objetivos diarios sincronizados'
          : 'Plan de dieta actualizado',
        color: 'success',
      });
    } else {
      await createDietPlan(payload);
      emit('notify', {
        text: wasActive
          ? 'Plan creado y objetivos diarios sincronizados'
          : 'Plan de dieta creado',
        color: 'success',
      });
    }
    if (wasActive) emit('targets-synced');
    cancelForm();
    await loadPlans();
  } catch (error) {
    console.error('Error guardando plan de dieta:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo guardar el plan'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

async function onActivate(plan) {
  try {
    activatingId.value = plan.id;
    await activateDietPlan(plan.id);
    emit('notify', {
      text: 'Plan activado · objetivos diarios sincronizados',
      color: 'success',
    });
    emit('targets-synced');
    await loadPlans();
  } catch (error) {
    console.error('Error activando plan de dieta:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo activar el plan'),
      color: 'error',
    });
  } finally {
    activatingId.value = null;
  }
}

async function onDelete(plan) {
  const ok = window.confirm(`¿Eliminar el plan "${plan.title}"? Esta acción no se puede deshacer.`);
  if (!ok) return;

  try {
    deletingId.value = plan.id;
    await deleteDietPlan(plan.id);
    emit('notify', { text: 'Plan de dieta eliminado', color: 'success' });
    if (editingPlan.value?.id === plan.id) {
      cancelForm();
    }
    await loadPlans();
  } catch (error) {
    console.error('Error eliminando plan de dieta:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo eliminar el plan'),
      color: 'error',
    });
  } finally {
    deletingId.value = null;
  }
}

function formatMacros(plan) {
  return `${Number(plan.calories) || 0} kcal · P ${Number(plan.protein_g) || 0}g · C ${Number(plan.carbs_g) || 0}g · G ${Number(plan.fats_g) || 0}g`;
}

watch(
  () => props.clientId,
  () => {
    cancelForm();
    loadPlans();
  },
);

onMounted(() => {
  loadPlans();
});
</script>

<template>
  <div class="dpp">
    <div class="dpp__head">
      <div class="min-w-0">
        <h3 class="dpp__title">Planes de Dieta</h3>
        <p class="dpp__hint">
          Al activar, sincroniza los objetivos diarios · puedes fijar macros sin plan
        </p>
      </div>
      <v-btn
        v-if="!showForm"
        color="primary"
        size="small"
        class="font-weight-bold"
        prepend-icon="mdi-plus"
        :disabled="loading"
        @click="startCreate"
      >
        Nuevo plan
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" height="2" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" density="compact" class="mb-2">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadPlans">Reintentar</v-btn>
      </template>
    </v-alert>

    <DietPlanForm
      v-if="showForm"
      :client-id="clientId"
      :initial-plan="editingPlan"
      :saving="saving"
      @submit="onSubmit"
      @cancel="cancelForm"
    />

    <template v-else>
      <p v-if="!loading && !plans.length" class="dpp__empty">
        Aún no hay planes para este alumno. Crea el primero.
      </p>

      <v-card
        v-for="plan in plans"
        :key="plan.id"
        class="dpp__card"
        variant="outlined"
      >
        <v-card-text class="dpp__card-body">
          <div class="dpp__card-main">
            <div class="dpp__card-title-row">
              <span class="dpp__card-title">{{ plan.title }}</span>
              <v-chip
                v-if="plan.is_active"
                color="primary"
                size="x-small"
                class="font-weight-bold"
              >
                Activo
              </v-chip>
            </div>
            <p class="dpp__card-macros">{{ formatMacros(plan) }}</p>
            <p v-if="plan.meals?.length" class="dpp__card-meta">
              {{ plan.meals.length }}
              {{ plan.meals.length === 1 ? 'comida' : 'comidas' }}
            </p>
          </div>
          <div class="dpp__card-actions">
            <v-btn
              v-if="!plan.is_active"
              size="x-small"
              variant="tonal"
              color="primary"
              :loading="activatingId === plan.id"
              @click="onActivate(plan)"
            >
              Activar
            </v-btn>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="startEdit(plan)"
            >
              Editar
            </v-btn>
            <v-btn
              size="x-small"
              variant="text"
              color="error"
              :loading="deletingId === plan.id"
              @click="onDelete(plan)"
            >
              Eliminar
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.dpp {
  margin-top: 1rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dpp__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.dpp__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.dpp__hint {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dpp__empty {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dpp__card {
  margin-bottom: 0.55rem;
  background: rgba(255, 255, 255, 0.02) !important;
}

.dpp__card:last-child {
  margin-bottom: 0;
}

.dpp__card-body {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem !important;
}

.dpp__card-main {
  min-width: 0;
  flex: 1 1 12rem;
}

.dpp__card-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.dpp__card-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.dpp__card-macros {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #c5cad3;
}

.dpp__card-meta {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dpp__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: center;
}
</style>
