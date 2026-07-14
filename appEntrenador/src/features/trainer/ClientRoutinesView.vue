<script setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getClientById } from './api/clientsApi.js';
import { createExercise, getExercises } from './api/exercisesApi.js';
import {
  createClientRoutine,
  deleteRoutine,
  getClientRoutines,
  updateRoutine,
} from './api/routinesApi.js';
import { createTemplate } from './api/templatesApi.js';
import { getClientWorkoutSessions } from './api/workoutSessionsApi.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DEFAULT_TARGET_MUSCLE = 'General';

const route = useRoute();
const router = useRouter();

const clientId = Number(route.params.clientId);
const client = shallowRef(null);
const routines = ref([]);
const workoutSessions = ref([]);
const catalogExercises = ref([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const savingCatalogIndex = shallowRef(null);
const savingTemplateId = shallowRef(null);
const editingId = shallowRef(null);
const expandedSessionId = shallowRef(null);

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

const catalogByName = computed(() => {
  const map = new Map();
  for (const item of catalogExercises.value) {
    map.set(item.name.toLowerCase(), item);
  }
  return map;
});

/** String titles for combobox so free typing is not blocked by object items. */
const catalogNames = computed(() => (
  catalogExercises.value.map((item) => item.name)
));

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const isNameInCatalog = (nombre) => {
  const key = (nombre || '').trim().toLowerCase();
  return key ? catalogByName.value.has(key) : false;
};

const resolveExerciseName = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.name || value.title || value.value || '';
  }
  return String(value);
};

const onExerciseNameUpdate = (index, value) => {
  const ex = form.ejercicios[index];
  if (!ex) return;

  const name = resolveExerciseName(value);
  ex.nombre = name;

  const match = catalogByName.value.get(name.trim().toLowerCase());
  if (match && !ex.indicaciones?.trim() && match.description) {
    ex.indicaciones = match.description;
  }
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

const loadCatalog = async () => {
  // Autocomplete needs a wider set than the catalog page (max API limit = 100).
  const res = await getExercises({ limit: 100 });
  catalogExercises.value = res.data.data ?? [];
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

  try {
    const sessionsRes = await getClientWorkoutSessions(clientId);
    workoutSessions.value = sessionsRes.data.data ?? [];
  } catch (error) {
    console.error('Error cargando historial de entrenamientos:', error);
    workoutSessions.value = [];
    showNotification(
      getApiErrorMessage(error, 'No se pudo cargar el historial de entrenamientos'),
      'warning',
    );
  }

  try {
    await loadCatalog();
  } catch (error) {
    console.error('Error cargando catálogo de ejercicios:', error);
    catalogExercises.value = [];
    showNotification(
      getApiErrorMessage(error, 'Catálogo no disponible; puedes escribir el nombre a mano'),
      'warning',
    );
  }
};

const formatSessionDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const toggleSession = (sessionId) => {
  expandedSessionId.value = expandedSessionId.value === sessionId ? null : sessionId;
};

const saveExerciseToCatalog = async (index) => {
  const ex = form.ejercicios[index];
  const name = ex?.nombre?.trim();
  if (!name || isNameInCatalog(name)) return;

  try {
    savingCatalogIndex.value = index;
    await createExercise({
      name,
      target_muscle: DEFAULT_TARGET_MUSCLE,
      description: ex.indicaciones?.trim() || null,
      media_type: 'none',
    });
    await loadCatalog();
    showNotification(`"${name}" guardado en el catálogo`);
  } catch (error) {
    console.error('Error guardando ejercicio en catálogo:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar en el catálogo'), 'error');
  } finally {
    savingCatalogIndex.value = null;
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

const handleSaveAsTemplate = async (routine) => {
  if (!routine?.id) return;

  try {
    savingTemplateId.value = routine.id;
    await createTemplate({
      name: routine.nombre_rutina,
      notes: '',
      exercises: (routine.ejercicios || []).map((ex) => ({
        nombre: ex.nombre,
        series: Number(ex.series),
        repeticiones: Number(ex.repeticiones),
        peso: Number(ex.peso),
        indicaciones: ex.indicaciones || '',
      })),
    });
    showNotification(`"${routine.nombre_rutina}" guardada en Biblioteca`);
  } catch (error) {
    console.error('Error guardando plantilla:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar como plantilla'), 'error');
  } finally {
    savingTemplateId.value = null;
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
  <AppShell role="trainer" active="clients">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <v-btn
            variant="text"
            color="#8B929E"
            class="mb-2 px-0"
            prepend-icon="mdi-arrow-left"
            @click="router.push('/trainer/clients')"
          >
            Volver a alumnos
          </v-btn>
          <h1 class="header-title">{{ pageTitle }}</h1>
          <p v-if="client" class="header-greeting">
            @{{ client.username }}
          </p>
        </div>
        <div class="header-right">
          <button
            type="button"
            class="header-logout-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <v-icon icon="mdi-logout-variant" size="20" />
          </button>
        </div>
      </header>

      <div class="content-panel pt-0">
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

        <template v-else>
          <v-row>
            <v-col cols="12" md="5">
              <div class="functional-card">
                <h3 class="card-section-title mb-1">
                  {{ editingId ? 'Editar rutina' : 'Nueva rutina' }}
                </h3>
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  class="mb-4 px-0"
                  prepend-icon="mdi-dumbbell"
                  @click="router.push('/trainer/exercises')"
                >
                  Abrir catálogo
                </v-btn>

                <v-select
                  v-model="form.dia_semana"
                  :items="DAYS"
                  label="Día de la semana"
                  density="compact"
                  class="mb-3"
                  color="primary"
                  bg-color="surface"
                  :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
                  :list-props="{ bgColor: 'surface', color: undefined }"
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
                  <v-combobox
                    v-model="ex.nombre"
                    :items="catalogNames"
                    label="Nombre (catálogo o texto libre)"
                    density="compact"
                    class="mb-2"
                    clearable
                    hide-no-data
                    auto-select-first
                    @update:model-value="(value) => onExerciseNameUpdate(index, value)"
                  >
                    <template #item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :subtitle="catalogByName.get(String(item.value ?? item.title ?? '').toLowerCase())?.target_muscle"
                      />
                    </template>
                  </v-combobox>
                  <v-btn
                    v-if="ex.nombre?.trim() && !isNameInCatalog(ex.nombre)"
                    size="small"
                    variant="text"
                    color="primary"
                    class="mb-2 px-0"
                    :loading="savingCatalogIndex === index"
                    @click="saveExerciseToCatalog(index)"
                  >
                    Guardar en catálogo
                  </v-btn>
                  <v-row dense>
                    <v-col cols="12" sm="4">
                      <v-text-field v-model.number="ex.series" type="number" label="Series" density="compact" min="1" />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field v-model.number="ex.repeticiones" type="number" label="Reps" density="compact" min="1" />
                    </v-col>
                    <v-col cols="12" sm="4">
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

                <v-btn variant="outlined" class="mb-4 tf-btn-muted" block @click="addExerciseRow">
                  Añadir ejercicio
                </v-btn>

                <div class="d-flex ga-2 flex-wrap routine-form-actions">
                  <v-btn
                    color="primary"
                    class="font-weight-bold flex-grow-1"
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
                <div class="d-flex justify-space-between align-start mb-4 flex-wrap ga-2">
                  <div class="min-w-0">
                    <div class="text-caption text-cyan mb-1">{{ routine.dia_semana }}</div>
                    <h3 class="card-section-title mb-0">{{ routine.nombre_rutina }}</h3>
                  </div>
                  <div class="d-flex ga-1 flex-shrink-0 flex-wrap">
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      :loading="savingTemplateId === routine.id"
                      @click="handleSaveAsTemplate(routine)"
                    >
                      Guardar en Biblioteca
                    </v-btn>
                    <v-btn size="small" variant="text" color="primary" @click="startEdit(routine)">
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

          <div class="functional-card mt-6">
            <h3 class="card-section-title mb-2">Historial de entrenamientos</h3>
            <p class="text-caption text-medium-emphasis mb-4">
              Sesiones completadas por el alumno (peso y reps reales).
            </p>

            <div v-if="workoutSessions.length === 0" class="text-medium-emphasis">
              Aún no hay entrenamientos registrados.
            </div>

            <div
              v-for="session in workoutSessions"
              :key="session.id"
              class="workout-history-item mb-3"
            >
              <button
                type="button"
                class="workout-history-header"
                @click="toggleSession(session.id)"
              >
                <div>
                  <div class="exercise-name">{{ session.routine_name }}</div>
                  <div class="exercise-meta">
                    {{ formatSessionDate(session.finished_at) }}
                    · {{ session.sets?.length || 0 }} series
                    · {{ session.status }}
                  </div>
                </div>
                <v-icon
                  :icon="expandedSessionId === session.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="20"
                  color="#8B929E"
                />
              </button>

              <div v-if="expandedSessionId === session.id" class="workout-history-sets mt-3">
                <div
                  v-for="set in session.sets"
                  :key="set.id"
                  class="workout-history-set"
                >
                  <span class="font-weight-medium">{{ set.exercise_name }}</span>
                  <span class="exercise-meta">
                    Serie {{ set.set_number }} · {{ set.reps }} reps · {{ set.weight }} kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </AppShell>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
    {{ snackbar.text }}
  </v-snackbar>
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

.workout-history-item {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.18);
}

.workout-history-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: transparent;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.workout-history-sets {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.75rem;
}

.workout-history-set {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.9rem;
}

.min-w-0 {
  min-width: 0;
}

@media (max-width: 600px) {
  .functional-card {
    padding: 1rem;
  }

  .routine-form-actions {
    flex-direction: column;
  }

  .routine-form-actions .v-btn {
    width: 100%;
  }
}
</style>
