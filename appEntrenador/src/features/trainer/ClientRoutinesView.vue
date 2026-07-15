<script setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import {
  buildProfileFormData,
  getProfile,
  updateProfile,
} from '../../shared/api/profileApi.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import ProfileFormCard from '../../shared/components/ProfileFormCard.vue';
import WorkoutSessionHistoryList from '../../shared/components/WorkoutSessionHistoryList.vue';
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
import BodyCompositionPanel from './components/BodyCompositionPanel.vue';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DEFAULT_TARGET_MUSCLE = 'General';

const route = useRoute();
const router = useRouter();

const clientId = Number(route.params.clientId);
const client = shallowRef(null);
const clientProfile = shallowRef(null);
const routines = ref([]);
const workoutSessions = ref([]);
const catalogExercises = ref([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const savingProfile = shallowRef(false);
const savingCatalogIndex = shallowRef(null);
const savingTemplateId = shallowRef(null);
const editingId = shallowRef(null);

const form = reactive({
  dia_semana: 'Lunes',
  nombre_rutina: '',
  ejercicios: [
    { nombre: '', exercise_id: null, series: 3, repeticiones: 10, peso: 0, indicaciones: '' },
  ],
});

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const pageTitle = computed(() => (
  client.value ? client.value.nombre : 'Alumno'
));

const routinesCount = computed(() => routines.value.length);
const sessionsCount = computed(() => workoutSessions.value.length);

const catalogByName = computed(() => {
  const map = new Map();
  for (const item of catalogExercises.value) {
    map.set(item.name.toLowerCase(), item);
  }
  return map;
});

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
  ex.exercise_id = match?.id ?? null;

  if (match && !ex.indicaciones?.trim() && match.description) {
    ex.indicaciones = match.description;
  }
};

const resetForm = () => {
  editingId.value = null;
  form.dia_semana = 'Lunes';
  form.nombre_rutina = '';
  form.ejercicios = [
    { nombre: '', exercise_id: null, series: 3, repeticiones: 10, peso: 0, indicaciones: '' },
  ];
};

const addExerciseRow = () => {
  form.ejercicios.push({
    nombre: '',
    exercise_id: null,
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
    const profileRes = await getProfile(clientId);
    clientProfile.value = profileRes.data.data ?? null;
  } catch (error) {
    console.error('Error cargando perfil del alumno:', error);
    clientProfile.value = {
      user_id: clientId,
      nombre: client.value?.nombre || '',
      username: client.value?.username || '',
      telefono: '',
      fecha_nacimiento: '',
      sexo: '',
      lesiones: '',
      objetivo: '',
      foto_url: null,
    };
    showNotification(
      getApiErrorMessage(error, 'No se pudo cargar el perfil del alumno'),
      'warning',
    );
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

const onSaveProfile = async ({ fields, fotoFile, done }) => {
  try {
    savingProfile.value = true;
    const formData = buildProfileFormData(fields, fotoFile);
    const response = await updateProfile(clientId, formData);
    clientProfile.value = response.data.data ?? clientProfile.value;
    showNotification('Perfil del alumno actualizado');
    done?.(true);
  } catch (error) {
    console.error('Error guardando perfil del alumno:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar el perfil'), 'error');
    done?.(false);
  } finally {
    savingProfile.value = false;
  }
};

const saveExerciseToCatalog = async (index) => {
  const ex = form.ejercicios[index];
  const name = ex?.nombre?.trim();
  if (!name || isNameInCatalog(name)) return;

  try {
    savingCatalogIndex.value = index;
    const res = await createExercise({
      name,
      target_muscle: DEFAULT_TARGET_MUSCLE,
      description: ex.indicaciones?.trim() || null,
      media_type: 'none',
    });
    await loadCatalog();
    const created = res.data?.data;
    if (created?.id) {
      ex.exercise_id = created.id;
    } else {
      const match = catalogByName.value.get(name.toLowerCase());
      ex.exercise_id = match?.id ?? null;
    }
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
    exercise_id: ex.exercise_id ?? null,
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
    exercise_id: ex.exercise_id ?? null,
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
        exercise_id: ex.exercise_id ?? null,
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
      <header class="dashboard-header ficha-header">
        <div class="header-left">
          <v-btn
            variant="text"
            color="#8B929E"
            class="ficha-back px-0"
            size="small"
            prepend-icon="mdi-arrow-left"
            @click="router.push('/trainer/clients')"
          >
            Alumnos
          </v-btn>
          <h1 class="header-title">{{ pageTitle }}</h1>
          <div v-if="client" class="ficha-meta">
            <span class="ficha-meta__user">@{{ client.username }}</span>
            <span class="ficha-meta__dot" aria-hidden="true">·</span>
            <span><strong>{{ routinesCount }}</strong> rutinas</span>
            <span class="ficha-meta__dot" aria-hidden="true">·</span>
            <span><strong>{{ sessionsCount }}</strong> sesiones</span>
          </div>
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

      <div class="ficha-body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
          height="2"
        />

        <template v-else>
          <ProfileFormCard
            title="Perfil"
            :profile="clientProfile"
            :saving="savingProfile"
            @save="onSaveProfile"
          />

          <div class="ficha-grid">
            <!-- Columna principal: rutinas -->
            <div class="ficha-col">
              <section class="ficha-panel routine-editor">
                <div class="ficha-panel__head">
                  <div>
                    <h2 class="ficha-panel__title">
                      {{ editingId ? 'Editar rutina' : 'Nueva rutina' }}
                    </h2>
                    <p class="ficha-panel__hint">Asigna día, nombre y la carga de cada ejercicio</p>
                  </div>
                  <v-btn
                    variant="text"
                    color="primary"
                    size="x-small"
                    class="px-1"
                    prepend-icon="mdi-dumbbell"
                    @click="router.push('/trainer/library/exercises')"
                  >
                    Catálogo
                  </v-btn>
                </div>

                <div class="routine-meta-row">
                  <label class="field-block field-block--day">
                    <span class="field-cap">Día</span>
                    <v-select
                      v-model="form.dia_semana"
                      :items="DAYS"
                      density="compact"
                      variant="outlined"
                      hide-details
                      color="primary"
                      :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
                      :list-props="{ bgColor: 'surface', color: undefined }"
                    />
                  </label>
                  <label class="field-block field-block--name">
                    <span class="field-cap">Nombre de la rutina</span>
                    <v-text-field
                      v-model="form.nombre_rutina"
                      placeholder="Ej. Empuje, Piernas…"
                      density="compact"
                      variant="outlined"
                      hide-details
                      color="primary"
                    />
                  </label>
                </div>

                <div
                  v-for="(ex, index) in form.ejercicios"
                  :key="index"
                  class="exercise-form-block"
                >
                  <div class="exercise-form-block__head">
                    <span class="exercise-form-label">Ejercicio {{ index + 1 }}</span>
                    <v-btn
                      v-if="form.ejercicios.length > 1"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      aria-label="Quitar ejercicio"
                      @click="removeExerciseRow(index)"
                    />
                  </div>

                  <label class="field-block">
                    <span class="field-cap">Ejercicio</span>
                    <v-autocomplete
                      :model-value="ex.nombre"
                      :items="catalogExercises"
                      item-title="name"
                      item-value="name"
                      placeholder="Catálogo o texto libre"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      clearable
                      hide-no-data
                      auto-select-first
                      free-solo
                      color="primary"
                      :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
                      :list-props="{ bgColor: 'surface', color: undefined }"
                      @update:model-value="(value) => onExerciseNameUpdate(index, value)"
                    >
                      <template #item="{ props: itemProps, item }">
                        <v-list-item
                          v-bind="itemProps"
                          :subtitle="item.raw?.target_muscle"
                        />
                      </template>
                    </v-autocomplete>
                  </label>

                  <v-btn
                    v-if="ex.nombre?.trim() && !isNameInCatalog(ex.nombre)"
                    size="x-small"
                    variant="text"
                    color="primary"
                    class="exercise-form-block__catalog-btn"
                    :loading="savingCatalogIndex === index"
                    @click="saveExerciseToCatalog(index)"
                  >
                    Guardar en catálogo
                  </v-btn>

                  <div class="exercise-metrics" role="group" aria-label="Carga">
                    <label class="metric">
                      <span class="field-cap">Series</span>
                      <v-text-field
                        v-model.number="ex.series"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        min="1"
                        color="primary"
                      />
                    </label>
                    <label class="metric">
                      <span class="field-cap">Reps</span>
                      <v-text-field
                        v-model.number="ex.repeticiones"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        min="1"
                        color="primary"
                      />
                    </label>
                    <label class="metric metric--peso">
                      <span class="field-cap">Kg</span>
                      <v-text-field
                        v-model.number="ex.peso"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        min="0"
                        step="0.5"
                        color="primary"
                      />
                    </label>
                  </div>

                  <label class="field-block">
                    <span class="field-cap">Indicaciones <em>(opcional)</em></span>
                    <v-textarea
                      v-model="ex.indicaciones"
                      placeholder="Notas técnicas breves"
                      density="compact"
                      variant="outlined"
                      rows="1"
                      auto-grow
                      hide-details
                      color="primary"
                      class="exercise-notes"
                    />
                  </label>
                </div>

                <div class="ficha-form-actions">
                  <v-btn
                    variant="outlined"
                    size="small"
                    class="tf-btn-muted"
                    @click="addExerciseRow"
                  >
                    + Ejercicio
                  </v-btn>
                  <div class="ficha-form-actions__primary">
                    <v-btn
                      v-if="editingId"
                      variant="text"
                      size="small"
                      @click="resetForm"
                    >
                      Cancelar
                    </v-btn>
                    <v-btn
                      color="primary"
                      class="font-weight-bold"
                      size="small"
                      :loading="saving"
                      @click="handleSave"
                    >
                      {{ editingId ? 'Guardar' : 'Crear rutina' }}
                    </v-btn>
                  </div>
                </div>
              </section>

              <section class="ficha-panel">
                <div class="ficha-panel__head">
                  <h2 class="ficha-panel__title">Rutinas asignadas</h2>
                  <span class="ficha-panel__count">{{ routinesCount }}</span>
                </div>

                <p v-if="routines.length === 0" class="ficha-empty">
                  Sin rutinas aún. Crea la primera arriba.
                </p>

                <div
                  v-for="routine in routines"
                  :key="routine.id"
                  class="routine-card"
                >
                  <div class="routine-card__head">
                    <div class="min-w-0">
                      <span class="routine-card__day">{{ routine.dia_semana }}</span>
                      <h3 class="routine-card__name">{{ routine.nombre_rutina }}</h3>
                    </div>
                    <div class="routine-card__actions">
                      <v-btn
                        icon="mdi-bookshelf"
                        size="x-small"
                        variant="text"
                        color="primary"
                        :loading="savingTemplateId === routine.id"
                        title="Guardar en Biblioteca"
                        @click="handleSaveAsTemplate(routine)"
                      />
                      <v-btn
                        icon="mdi-pencil"
                        size="x-small"
                        variant="text"
                        color="primary"
                        title="Editar"
                        @click="startEdit(routine)"
                      />
                      <v-btn
                        icon="mdi-delete-outline"
                        size="x-small"
                        variant="text"
                        color="error"
                        title="Eliminar"
                        @click="handleDelete(routine.id)"
                      />
                    </div>
                  </div>
                  <div class="exercise-list">
                    <div
                      v-for="(ejercicio, i) in routine.ejercicios"
                      :key="ejercicio.id || i"
                      class="exercise-item"
                    >
                      <div class="exercise-num">{{ i + 1 }}</div>
                      <div class="exercise-details min-w-0">
                        <div class="exercise-name">{{ ejercicio.nombre }}</div>
                        <div class="exercise-meta">
                          {{ ejercicio.series }}×{{ ejercicio.repeticiones }} · {{ ejercicio.peso }} kg
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Columna lateral: composición + sesiones -->
            <aside class="ficha-col ficha-col--side">
              <BodyCompositionPanel
                :client-id="clientId"
                @notify="({ text, color }) => showNotification(text, color)"
              />

              <section class="ficha-panel">
                <div class="ficha-panel__head">
                  <h2 class="ficha-panel__title">Entrenamientos</h2>
                  <span class="ficha-panel__hint">Toca para detalle</span>
                </div>
                <WorkoutSessionHistoryList
                  :sessions="workoutSessions"
                  compact
                  empty-text="Sin sesiones registradas."
                />
              </section>
            </aside>
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
.ficha-header .header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ficha-back {
  align-self: flex-start;
  min-height: 28px !important;
}

.ficha-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: #8b929e;
}

.ficha-meta strong {
  color: #00e5ff;
  font-weight: 700;
}

.ficha-meta__user {
  color: #c5cad3;
}

.ficha-meta__dot {
  opacity: 0.45;
}

.ficha-body {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

@media (min-width: 960px) {
  .ficha-body {
    padding: 0.35rem 1.25rem 1.5rem;
  }
}

.ficha-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
  align-items: start;
}

@media (min-width: 960px) {
  .ficha-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
    gap: 1rem;
  }
}

.ficha-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.ficha-panel {
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ficha-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}

.ficha-panel__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
}

.ficha-panel__count {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #c5cad3;
}

.ficha-panel__hint,
.ficha-empty {
  margin: 0;
  font-size: 0.72rem;
  color: #8b929e;
}

.exercise-form-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.55rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.45rem;
}

.exercise-form-block__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 22px;
}

.exercise-form-label {
  font-size: 0.68rem;
  color: #00e5ff;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.exercise-form-block__catalog-btn {
  align-self: flex-start;
  min-height: 22px !important;
  padding-inline: 0 !important;
}

.field-cap {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: #8b929e;
  margin-bottom: 0.2rem;
  line-height: 1.2;
}

.field-cap em {
  font-style: normal;
  font-weight: 500;
  opacity: 0.75;
}

.field-block {
  display: block;
  width: 100%;
  min-width: 0;
}

.routine-meta-row {
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  gap: 0.45rem;
  margin-bottom: 0.5rem;
  align-items: end;
}

@media (max-width: 520px) {
  .routine-meta-row {
    grid-template-columns: 1fr;
  }
}

.exercise-metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.4rem;
}

.metric {
  display: block;
  width: 4.5rem;
  flex: 0 0 4.5rem;
}

.metric--peso {
  width: 5rem;
  flex-basis: 5rem;
}

.exercise-notes {
  margin-top: 0;
}

.routine-editor :deep(.v-field) {
  border-radius: 8px;
  font-size: 0.85rem;
}

.routine-editor :deep(.v-input) {
  margin-bottom: 0;
}

.routine-editor :deep(.metric .v-field__input) {
  text-align: center;
  font-variant-numeric: tabular-nums;
  padding-inline: 0.35rem !important;
  min-width: 0;
}

.routine-editor :deep(.metric input) {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.ficha-form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.55rem;
}

.ficha-form-actions__primary {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

.routine-card {
  padding: 0.6rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.16);
  margin-bottom: 0.45rem;
}

.routine-card:last-child {
  margin-bottom: 0;
}

.routine-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.45rem;
}

.routine-card__day {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  color: #00e5ff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.routine-card__name {
  margin: 0.1rem 0 0;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
}

.routine-card__actions {
  display: flex;
  flex-shrink: 0;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.exercise-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.exercise-num {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(0, 229, 255, 0.12);
  color: #00e5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.exercise-name {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.25;
}

.exercise-meta {
  font-size: 0.7rem;
  color: #8b929e;
}

.min-w-0 {
  min-width: 0;
}

/* BodyCompositionPanel ya trae margen; en columna lateral lo anulamos */
.ficha-col--side :deep(.bcp) {
  margin-top: 0;
}
</style>
