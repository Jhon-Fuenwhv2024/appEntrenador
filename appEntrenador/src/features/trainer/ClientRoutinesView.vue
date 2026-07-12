<script setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import { getClientById } from './api/clientsApi.js';
import {
  createClientRoutine,
  deleteRoutine,
  getClientRoutines,
  updateRoutine,
} from './api/routinesApi.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const route = useRoute();
const router = useRouter();

const clientId = Number(route.params.clientId);
const client = shallowRef(null);
const routines = ref([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const editingId = shallowRef(null);

const form = reactive({
  dia_semana: 'Lunes',
  nombre_rutina: '',
  ejercicios: [
    { nombre: '', series: 3, repeticiones: 10, peso: 0, indicaciones: '' },
  ],
});

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const pageTitle = computed(() => (
  client.value ? `Rutinas de ${client.value.nombre}` : 'Rutinas del alumno'
));

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const resetForm = () => {
  editingId.value = null;
  form.dia_semana = 'Lunes';
  form.nombre_rutina = '';
  form.ejercicios = [
    { nombre: '', series: 3, repeticiones: 10, peso: 0, indicaciones: '' },
  ];
};

const addExerciseRow = () => {
  form.ejercicios.push({
    nombre: '',
    series: 3,
    repeticiones: 10,
    peso: 0,
    indicaciones: '',
  });
};

const removeExerciseRow = (index) => {
  if (form.ejercicios.length <= 1) return;
  form.ejercicios.splice(index, 1);
};

const loadData = async () => {
  try {
    loading.value = true;
    const [clientRes, routinesRes] = await Promise.all([
      getClientById(clientId),
      getClientRoutines(clientId),
    ]);

    client.value = clientRes.data.data;
    routines.value = routinesRes.data.data ?? [];
  } catch (error) {
    console.error('Error cargando detalle de cliente:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo cargar el alumno'), 'error');
  } finally {
    loading.value = false;
  }
};

const startEdit = (routine) => {
  editingId.value = routine.id;
  form.dia_semana = routine.dia_semana;
  form.nombre_rutina = routine.nombre_rutina;
  form.ejercicios = (routine.ejercicios || []).map((ex) => ({
    nombre: ex.nombre,
    series: ex.series,
    repeticiones: ex.repeticiones,
    peso: Number(ex.peso) || 0,
    indicaciones: ex.indicaciones || '',
  }));

  if (form.ejercicios.length === 0) {
    addExerciseRow();
  }
};

const buildPayload = () => ({
  dia_semana: form.dia_semana,
  nombre_rutina: form.nombre_rutina.trim(),
  ejercicios: form.ejercicios.map((ex) => ({
    nombre: ex.nombre.trim(),
    series: Number(ex.series),
    repeticiones: Number(ex.repeticiones),
    peso: Number(ex.peso),
    indicaciones: ex.indicaciones?.trim() || '',
  })),
});

const handleSave = async () => {
  try {
    saving.value = true;
    const payload = buildPayload();

    if (editingId.value) {
      await updateRoutine(editingId.value, payload);
      showNotification('Rutina actualizada');
    } else {
      await createClientRoutine(clientId, payload);
      showNotification('Rutina creada');
    }

    resetForm();
    await loadData();
  } catch (error) {
    console.error('Error guardando rutina:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar la rutina'), 'error');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (routineId) => {
  if (!window.confirm('¿Eliminar esta rutina y sus ejercicios?')) return;

  try {
    await deleteRoutine(routineId);
    showNotification('Rutina eliminada');
    if (editingId.value === routineId) resetForm();
    await loadData();
  } catch (error) {
    console.error('Error eliminando rutina:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo eliminar'), 'error');
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

onMounted(() => {
  const user = getSessionUser();

  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  loadData();
});
</script>

<template>
  <div class="dashboard-bg">
    <nav class="sidebar-pill">
      <div class="logo-wrap">
        <AppLogo size="md" />
      </div>
      <div class="nav-item" title="Dashboard" @click="router.push('/dashboard')">
        <v-icon icon="mdi-view-dashboard-outline" size="24"></v-icon>
      </div>
      <div class="nav-item active">
        <v-icon icon="mdi-dumbbell" size="24"></v-icon>
      </div>
      <div class="nav-item nav-bottom mb-0" title="Cerrar Sesión" @click="handleLogout">
        <v-icon icon="mdi-logout-variant" size="24"></v-icon>
      </div>
    </nav>

    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <v-btn
            variant="text"
            color="#8B929E"
            class="mb-2 px-0"
            prepend-icon="mdi-arrow-left"
            @click="router.push('/dashboard')"
          >
            Volver al dashboard
          </v-btn>
          <h1 class="header-title">{{ pageTitle }}</h1>
          <p v-if="client" class="header-greeting">
            @{{ client.username }}
          </p>
        </div>
      </header>

      <div class="pa-8 pt-0">
        <v-progress-linear v-if="loading" indeterminate color="#00E5FF" class="mb-6" />

        <template v-else>
          <v-row>
            <v-col cols="12" md="5">
              <div class="functional-card">
                <h3 class="card-section-title mb-4">
                  {{ editingId ? 'Editar rutina' : 'Nueva rutina' }}
                </h3>

                <v-select
                  v-model="form.dia_semana"
                  :items="DAYS"
                  label="Día de la semana"
                  density="compact"
                  class="mb-3"
                />

                <v-text-field
                  v-model="form.nombre_rutina"
                  label="Nombre de la rutina"
                  density="compact"
                  class="mb-4"
                />

                <div
                  v-for="(ex, index) in form.ejercicios"
                  :key="index"
                  class="exercise-form-block mb-4"
                >
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption text-medium-emphasis">Ejercicio {{ index + 1 }}</span>
                    <v-btn
                      v-if="form.ejercicios.length > 1"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      @click="removeExerciseRow(index)"
                    />
                  </div>
                  <v-text-field v-model="ex.nombre" label="Nombre" density="compact" class="mb-2" />
                  <v-row dense>
                    <v-col cols="4">
                      <v-text-field v-model.number="ex.series" type="number" label="Series" density="compact" min="1" />
                    </v-col>
                    <v-col cols="4">
                      <v-text-field v-model.number="ex.repeticiones" type="number" label="Reps" density="compact" min="1" />
                    </v-col>
                    <v-col cols="4">
                      <v-text-field v-model.number="ex.peso" type="number" label="Peso (kg)" density="compact" min="0" step="0.5" />
                    </v-col>
                  </v-row>
                  <v-textarea
                    v-model="ex.indicaciones"
                    label="Indicaciones"
                    density="compact"
                    rows="2"
                    auto-grow
                  />
                </div>

                <v-btn variant="outlined" color="grey" class="mb-4" block @click="addExerciseRow">
                  Añadir ejercicio
                </v-btn>

                <div class="d-flex ga-2">
                  <v-btn
                    color="#00E5FF"
                    class="text-black font-weight-bold flex-grow-1"
                    :loading="saving"
                    @click="handleSave"
                  >
                    {{ editingId ? 'Guardar cambios' : 'Crear rutina' }}
                  </v-btn>
                  <v-btn v-if="editingId" variant="text" @click="resetForm">Cancelar</v-btn>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="7">
              <div v-if="routines.length === 0" class="functional-card">
                <p class="text-medium-emphasis mb-0">
                  Este alumno aún no tiene rutinas. Crea la primera a la izquierda.
                </p>
              </div>

              <div
                v-for="routine in routines"
                :key="routine.id"
                class="functional-card mb-4"
              >
                <div class="d-flex justify-space-between align-start mb-4">
                  <div>
                    <div class="text-caption text-cyan mb-1">{{ routine.dia_semana }}</div>
                    <h3 class="card-section-title mb-0">{{ routine.nombre_rutina }}</h3>
                  </div>
                  <div class="d-flex ga-1">
                    <v-btn size="small" variant="text" color="#00E5FF" @click="startEdit(routine)">
                      Editar
                    </v-btn>
                    <v-btn size="small" variant="text" color="error" @click="handleDelete(routine.id)">
                      Eliminar
                    </v-btn>
                  </div>
                </div>

                <div class="exercise-list">
                  <div
                    v-for="(ejercicio, i) in routine.ejercicios"
                    :key="ejercicio.id || i"
                    class="exercise-item"
                  >
                    <div class="exercise-num">{{ i + 1 }}</div>
                    <div class="exercise-details">
                      <div class="exercise-name">{{ ejercicio.nombre }}</div>
                      <div class="exercise-meta">
                        {{ ejercicio.series }} series · {{ ejercicio.repeticiones }} reps · {{ ejercicio.peso }} kg
                      </div>
                      <div v-if="ejercicio.indicaciones" class="text-caption mt-1">
                        {{ ejercicio.indicaciones }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </template>
      </div>
    </main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top right">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>
<style src="../../assets/clientDashboard.css" scoped></style>

<style scoped>
.functional-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
}

.exercise-form-block {
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.exercise-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.exercise-num {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(0, 229, 255, 0.12);
  color: #00e5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.exercise-name {
  font-weight: 600;
}

.exercise-meta {
  font-size: 0.8rem;
  color: #8b929e;
}

.card-section-title {
  font-size: 1.1rem;
  font-weight: 700;
}
</style>
