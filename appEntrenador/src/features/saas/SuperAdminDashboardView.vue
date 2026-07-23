<script setup>
/**
 * Panel SuperAdmin SaaS (Feature 037 + 065).
 * Lista trainers y permite actualizar plan FREE/PRO + fecha de vencimiento.
 * Soft-expiry: chip Vencido, fecha enfatizada, CTA Renovar Plan.
 */
import { computed, onMounted, reactive, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import {
  formatExpirationRelative,
  resolveEffectiveSaasPlan,
  toDateOnlyString,
} from '../../shared/saas/effectivePlan.js';
import { listTrainers, updateTrainerPlan } from './api/saasApi.js';

const router = useRouter();

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
  const raw = toDateOnlyString(value);
  return raw || '—';
}

function planColor(plan) {
  return plan === 'PRO' ? 'primary' : 'warning';
}

function trainerExpired(item) {
  if (typeof item?.is_expired === 'boolean') return item.is_expired;
  return resolveEffectiveSaasPlan(item?.saas_plan, item?.saas_expiration_date).is_expired;
}

function expirationHint(item) {
  if (!trainerExpired(item)) return null;
  return formatExpirationRelative(item?.saas_expiration_date);
}

function actionLabel(item) {
  return trainerExpired(item) ? 'Renovar Plan' : 'Actualizar Plan';
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
      <header class="mb-6 d-flex flex-wrap align-center justify-space-between ga-3">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">
            Panel SaaS
          </h1>
          <p class="text-medium-emphasis mb-0">
            Gestión manual de planes de entrenadores (Modo Dios).
          </p>
        </div>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-tag-multiple-outline"
          @click="router.push('/admin/exercises/tagger')"
        >
          Etiquetar ejercicios
        </v-btn>
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
          <div class="d-flex flex-wrap align-center ga-1">
            <v-chip
              :color="planColor(item.saas_plan)"
              size="small"
              variant="tonal"
              label
            >
              {{ item.saas_plan || 'FREE' }}
            </v-chip>
            <v-chip
              v-if="trainerExpired(item)"
              color="error"
              size="small"
              variant="tonal"
              label
              prepend-icon="mdi-alert-circle-outline"
            >
              Vencido
            </v-chip>
          </div>
        </template>

        <template #item.saas_expiration_date="{ item }">
          <div
            class="saas-exp"
            :class="{ 'saas-exp--expired': trainerExpired(item) }"
          >
            <span class="saas-exp__date">{{ formatDate(item.saas_expiration_date) }}</span>
            <span
              v-if="expirationHint(item)"
              class="saas-exp__hint"
            >
              {{ expirationHint(item) }}
            </span>
          </div>
        </template>

        <template #item.client_count="{ item }">
          {{ item.client_count ?? 0 }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            min-height="40"
            variant="tonal"
            :color="trainerExpired(item) ? 'error' : 'primary'"
            :prepend-icon="trainerExpired(item) ? 'mdi-refresh' : 'mdi-crown-outline'"
            :aria-label="`${actionLabel(item)} de ${item.nombre || item.username}`"
            @click="openPlanDialog(item)"
          >
            {{ actionLabel(item) }}
          </v-btn>
        </template>
      </v-data-table>
    </main>

    <v-dialog v-model="dialogOpen" max-width="420" persistent>
      <v-card color="surface">
        <v-card-title class="text-h6">
          {{ selectedTrainer && trainerExpired(selectedTrainer) ? 'Renovar plan' : 'Actualizar plan' }}
        </v-card-title>
        <v-card-subtitle v-if="selectedTrainer">
          {{ selectedTrainer.nombre }} (@{{ selectedTrainer.username }})
        </v-card-subtitle>

        <v-card-text>
          <v-alert
            v-if="selectedTrainer && trainerExpired(selectedTrainer)"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-4"
            border="start"
          >
            Plan PRO vencido. Pon una fecha futura o deja vacío para sin vencimiento.
          </v-alert>
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
        <v-btn variant="text" @click="snackbar.show = false">
          Cerrar
        </v-btn>
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

.saas-exp {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.25;
}

.saas-exp__date {
  color: var(--tf-on-surface);
}

.saas-exp--expired .saas-exp__date {
  color: rgb(var(--v-theme-error));
  font-weight: 600;
}

.saas-exp__hint {
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted);
}

.saas-exp--expired .saas-exp__hint {
  color: rgb(var(--v-theme-error));
}
</style>
