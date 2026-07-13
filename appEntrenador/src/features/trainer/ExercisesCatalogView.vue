<script setup>
import { onMounted, reactive, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import ExerciseCatalogForm from './components/ExerciseCatalogForm.vue';
import ExerciseCatalogList from './components/ExerciseCatalogList.vue';
import { useExercisesCatalog } from './composables/useExercisesCatalog.js';

const router = useRouter();
const formRef = ref(null);
const editingExercise = shallowRef(null);

const {
  exercises,
  totalCount,
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  loading,
  saving,
  searchQuery,
  errorMessage,
  globalCount,
  privateCount,
  pageSize,
  loadExercises,
  goPrevPage,
  goNextPage,
  addExercise,
  saveExercise,
  removeExercise,
} = useExercisesCatalog();

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

const handleCancelEdit = () => {
  editingExercise.value = null;
};

const handleEdit = (exercise) => {
  editingExercise.value = exercise;
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handleSubmit = async (payload) => {
  try {
    if (editingExercise.value?.id) {
      await saveExercise(editingExercise.value.id, payload);
      showNotification(`"${payload.name}" actualizado`);
      editingExercise.value = null;
      formRef.value?.resetForm();
      return;
    }

    await addExercise(payload);
    formRef.value?.resetForm();
    showNotification(`"${payload.name}" añadido a tu catálogo`);
  } catch {
    showNotification(errorMessage.value || 'No se pudo guardar el ejercicio', 'error');
  }
};

const handleDelete = async (exercise) => {
  const label = exercise.is_global ? 'global' : 'tuyo';
  if (!window.confirm(`¿Eliminar "${exercise.name}" (${label}) del catálogo?`)) {
    return;
  }

  try {
    await removeExercise(exercise.id);
    if (editingExercise.value?.id === exercise.id) {
      editingExercise.value = null;
      formRef.value?.resetForm();
    }
    showNotification(`"${exercise.name}" eliminado`);
  } catch {
    showNotification(errorMessage.value || 'No se pudo eliminar el ejercicio', 'error');
  }
};

onMounted(async () => {
  const user = getSessionUser();

  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  try {
    await loadExercises();
  } catch {
    showNotification(errorMessage.value || 'No se pudo cargar el catálogo', 'error');
  }
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
      <div class="nav-item active" title="Catálogo de ejercicios">
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
          <h1 class="header-title">Catálogo de ejercicios</h1>
          <p class="header-greeting">
            Crea, edita (GIF/video/descripción) o elimina ejercicios del catálogo.
          </p>
        </div>
      </header>

      <div class="pa-8 pt-0">
        <v-row>
          <v-col cols="12" md="4">
            <div class="functional-card">
              <ExerciseCatalogForm
                ref="formRef"
                :saving="saving"
                :editing-exercise="editingExercise"
                @submit="handleSubmit"
                @cancel-edit="handleCancelEdit"
              />
            </div>
          </v-col>

          <v-col cols="12" md="8">
            <div class="functional-card">
              <ExerciseCatalogList
                v-model:search-query="searchQuery"
                :exercises="exercises"
                :loading="loading"
                :total-count="totalCount"
                :page-size="pageSize"
                :current-page="currentPage"
                :total-pages="totalPages"
                :can-go-prev="canGoPrev"
                :can-go-next="canGoNext"
                :global-count="globalCount"
                :private-count="privateCount"
                :editing-id="editingExercise?.id ?? null"
                @edit="handleEdit"
                @delete="handleDelete"
                @prev-page="goPrevPage"
                @next-page="goNextPage"
              />
            </div>
          </v-col>
        </v-row>
      </div>
    </main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top right">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.functional-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
}
</style>
