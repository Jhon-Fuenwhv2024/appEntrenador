<script setup>
/**
 * Panel SuperAdmin SaaS (Feature 036 / 037 Fase 1).
 * Lista trainers y permite actualizar plan FREE/PRO + fecha de vencimiento.
 */
import { computed, onMounted, reactive, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { listTrainers, updateTrainerPlan } from './api/saasApi.js';

const loading = shallowRef(true);
const saving = shallowRef(false);
const loadError = shallowRef('');
const trainers = shallowRef([]);

const dialogOpen = shallowRef(false);
const selectedTrainer = shallowRef(null);
const formPlan = shallowRef('FREE');
const formExpiration = shallowRef('');

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const headers = [
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Usuario', key: 'username', sortable: true },
  { title: 'Plan', key: 'saas_plan', sortable: true },
  { title: 'Vencimiento', key: 'saas_expiration_date', sortable: true },
  { title: 'Clientes', key: 'client_count', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

const shellRole = computed(() => {
  const user = getSessionUser();
  return user?.rol === 'client' ? 'client' : 'trainer';
});

function notify(text, color = 'success') {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
}

function formatDate(value) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  return raw || '—';
}

function planColor(plan) {
  return plan === 'PRO' ? 'primary' : 'warning';
}

async function loadTrainers() {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await listTrainers();
    const data = response.data?.data;
    trainers.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error al listar trainers SaaS:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar los entrenadores');
    trainers.value = [];
  } finally {
    loading.value = false;
  }
}

function openPlanDialog(trainer) {
  selectedTrainer.value = trainer;
  formPlan.value = trainer?.saas_plan === 'PRO' ? 'PRO' : 'FREE';
  const exp = trainer?.saas_expiration_date;
  formExpiration.value = exp ? String(exp).slice(0, 10) : '';
  dialogOpen.value = true;
}

function closePlanDialog() {
  dialogOpen.value = false;
  selectedTrainer.value = null;
}

async function savePlan() {
  if (!selectedTrainer.value?.id) return;

  try {
    saving.value = true;
    await updateTrainerPlan(selectedTrainer.value.id, {
      saas_plan: formPlan.value,
      saas_expiration_date: formExpiration.value || null,
    });
    notify('Plan actualizado exitosamente');
    closePlanDialog();
    await loadTrainers();
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    notify(getApiErrorMessage(error, 'No se pudo actualizar el plan'), 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadTrainers();
});
</script>

<template>
  <AppShell :role="shellRole" active="saas">
    <main class="saas-panel pa-4 pa-md-6">
      <header class="mb-6">
        <h1 class="text-h5 font-weight-bold mb-1">Panel SaaS</h1>
        <p class="text-medium-emphasis mb-0">
          Gestión manual de planes de entrenadores (Modo Dios).
        </p>
      </header>

      <v-alert
        v-if="loadError"
        type="error"
        variant="tonal"
        class="mb-4"
        :text="loadError"
      />

      <v-data-table
        :headers="headers"
        :items="trainers"
        :loading="loading"
        item-value="id"
        class="saas-table"
        density="comfortable"
      >
        <template #item.saas_plan="{ item }">
          <v-chip
            :color="planColor(item.saas_plan)"
            size="small"
            variant="tonal"
            label
          >
            {{ item.saas_plan || 'FREE' }}
          </v-chip>
        </template>

        <template #item.saas_expiration_date="{ item }">
          {{ formatDate(item.saas_expiration_date) }}
        </template>

        <template #item.client_count="{ item }">
          {{ item.client_count ?? 0 }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-crown-outline"
            @click="openPlanDialog(item)"
          >
            Actualizar Plan
          </v-btn>
        </template>
      </v-data-table>
    </main>

    <v-dialog v-model="dialogOpen" max-width="420" persistent>
      <v-card color="surface">
        <v-card-title class="text-h6">
          Actualizar plan
        </v-card-title>
        <v-card-subtitle v-if="selectedTrainer">
          {{ selectedTrainer.nombre }} (@{{ selectedTrainer.username }})
        </v-card-subtitle>

        <v-card-text>
          <v-select
            v-model="formPlan"
            :items="['FREE', 'PRO']"
            label="Plan"
            color="primary"
            density="comfortable"
            hide-details="auto"
            class="mb-4"
            :menu-props="{ contentClass: 'tf-overlay-menu' }"
          />
          <v-text-field
            v-model="formExpiration"
            label="Fecha de expiración"
            type="date"
            color="primary"
            density="comfortable"
            hide-details="auto"
            hint="Formato YYYY-MM-DD. Vacío = sin vencimiento."
            persistent-hint
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="closePlanDialog">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="savePlan"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </AppShell>
</template>

<style scoped>
.saas-panel {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.saas-table {
  background: transparent;
}
</style>
