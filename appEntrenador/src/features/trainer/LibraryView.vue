<script setup>
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import {
  assignTemplate,
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from './api/templatesApi.js';
import AssignTemplateDialog from './components/AssignTemplateDialog.vue';
import ExercisesCatalogPanel from './components/ExercisesCatalogPanel.vue';
import TemplateFormDialog from './components/TemplateFormDialog.vue';
import TemplateList from './components/TemplateList.vue';

const router = useRouter();
const route = useRoute();

const templates = ref([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const formOpen = shallowRef(false);
const assignOpen = shallowRef(false);
const editingTemplate = shallowRef(null);
const assigningTemplate = shallowRef(null);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

/** Hub tabs: plantillas | catálogo (Feature 022). */
const libraryTab = computed({
  get: () => (route.path.includes('/exercises') ? 'exercises' : 'templates'),
  set: (value) => {
    router.push(value === 'exercises' ? '/trainer/library/exercises' : '/trainer/library');
  },
});

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const onCatalogNotify = ({ text, color }) => {
  showNotification(text, color);
};

const loadTemplates = async () => {
  try {
    loading.value = true;
    const response = await getTemplates();
    if (response.data.success) {
      templates.value = response.data.data ?? [];
    } else {
      templates.value = [];
      showNotification(response.data.error || 'No se pudieron cargar las plantillas', 'error');
    }
  } catch (error) {
    console.error('Error al cargar plantillas:', error);
    templates.value = [];
    showNotification(getApiErrorMessage(error, 'Error al cargar plantillas'), 'error');
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

const openCreate = () => {
  editingTemplate.value = null;
  formOpen.value = true;
};

const openEdit = (template) => {
  editingTemplate.value = template;
  formOpen.value = true;
};

const openAssign = (template) => {
  assigningTemplate.value = template;
  assignOpen.value = true;
};

const handleFormSubmit = async (payload) => {
  try {
    saving.value = true;
    if (editingTemplate.value?.id) {
      await updateTemplate(editingTemplate.value.id, payload);
      showNotification('Plantilla actualizada');
    } else {
      await createTemplate(payload);
      showNotification('Plantilla creada');
    }
    formOpen.value = false;
    editingTemplate.value = null;
    await loadTemplates();
  } catch (error) {
    showNotification(getApiErrorMessage(error, 'No se pudo guardar la plantilla'), 'error');
  } finally {
    saving.value = false;
  }
};

const handleAssignSubmit = async (payload) => {
  if (!assigningTemplate.value?.id) return;

  try {
    saving.value = true;
    await assignTemplate(assigningTemplate.value.id, payload);
    showNotification('Copia asignada al alumno');
    assignOpen.value = false;
    assigningTemplate.value = null;
  } catch (error) {
    showNotification(getApiErrorMessage(error, 'No se pudo asignar la plantilla'), 'error');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (template) => {
  if (!template?.id) return;
  if (!window.confirm(`¿Eliminar la plantilla "${template.name}"? Las rutinas ya asignadas no se borran.`)) {
    return;
  }

  try {
    await deleteTemplate(template.id);
    showNotification('Plantilla eliminada');
    await loadTemplates();
  } catch (error) {
    showNotification(getApiErrorMessage(error, 'No se pudo eliminar la plantilla'), 'error');
  }
};

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
    return;
  }
  if (libraryTab.value === 'templates') {
    loadTemplates();
  }
});

watch(libraryTab, (tab) => {
  if (tab === 'templates') {
    loadTemplates();
  }
});
</script>

<template>
  <AppShell role="trainer" active="library">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Biblioteca</h1>
          <p class="header-greeting text-medium-emphasis">
            Plantillas y catálogo de ejercicios
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

      <div class="library-page">
        <v-tabs
          v-model="libraryTab"
          color="primary"
          class="library-page__tabs mb-4"
          density="comfortable"
        >
          <v-tab value="templates" prepend-icon="mdi-file-document-multiple-outline">
            Plantillas
          </v-tab>
          <v-tab value="exercises" prepend-icon="mdi-dumbbell">
            Catálogo
          </v-tab>
        </v-tabs>

        <div v-if="libraryTab === 'templates'">
          <div class="library-page__toolbar">
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
              Nueva plantilla
            </v-btn>
          </div>

          <TemplateList
            :templates="templates"
            :loading="loading"
            @edit="openEdit"
            @assign="openAssign"
            @delete="handleDelete"
          />
        </div>

        <ExercisesCatalogPanel
          v-else
          @notify="onCatalogNotify"
        />
      </div>
    </main>
  </AppShell>

  <TemplateFormDialog
    v-model="formOpen"
    :template="editingTemplate"
    :saving="saving"
    @submit="handleFormSubmit"
  />

  <AssignTemplateDialog
    v-model="assignOpen"
    :template="assigningTemplate"
    :saving="saving"
    @submit="handleAssignSubmit"
  />

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
    {{ snackbar.text }}
    <template #actions>
      <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.library-page {
  padding: 0 16px 24px;
  max-width: 1100px;
}

.library-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.library-page__tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
}

@media (min-width: 961px) {
  .library-page {
    padding: 0 24px 32px;
  }
}
</style>
