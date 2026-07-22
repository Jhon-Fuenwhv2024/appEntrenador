<script setup>
/**
 * Assign a library template to the current client (Feature 061).
 * clientId is locked; user picks template + day.
 */
import { onMounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getTemplates } from '../api/templatesApi.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  clientId: {
    type: Number,
    required: true,
  },
  defaultDay: {
    type: String,
    default: 'Lunes',
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const templates = ref([]);
const loading = shallowRef(false);
const loadError = shallowRef('');
const templateId = shallowRef(null);
const diaSemana = shallowRef('Lunes');

const loadTemplates = async () => {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getTemplates();
    if (response.data.success) {
      templates.value = response.data.data ?? [];
    } else {
      templates.value = [];
      loadError.value = response.data.error || 'No se pudieron cargar las plantillas';
    }
  } catch (error) {
    templates.value = [];
    loadError.value = getApiErrorMessage(error, 'Error al cargar plantillas');
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    templateId.value = null;
    diaSemana.value = DAYS.includes(props.defaultDay) ? props.defaultDay : 'Lunes';
    loadTemplates();
  },
);

onMounted(() => {
  if (props.modelValue) loadTemplates();
});

const close = () => {
  emit('update:modelValue', false);
};

const handleSubmit = () => {
  if (!templateId.value) return;
  emit('submit', {
    templateId: Number(templateId.value),
    clientId: Number(props.clientId),
    dia_semana: diaSemana.value,
  });
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card bg-color="surface">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Desde biblioteca</span>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Cerrar" @click="close" />
      </v-card-title>

      <v-card-text>
        <p class="text-medium-emphasis mb-4">
          Se creará una <strong>copia independiente</strong> de la plantilla
          en este alumno. Editar la plantilla después no cambia esa rutina.
        </p>

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        />

        <v-alert
          v-else-if="loadError"
          type="error"
          variant="tonal"
          density="comfortable"
          class="mb-4"
        >
          {{ loadError }}
        </v-alert>

        <v-alert
          v-else-if="!loading && templates.length === 0"
          type="info"
          variant="tonal"
          density="comfortable"
          class="mb-4"
        >
          No hay plantillas. Crea una en Biblioteca o guarda una rutina existente.
        </v-alert>

        <v-select
          v-model="templateId"
          :items="templates"
          item-title="name"
          item-value="id"
          label="Plantilla"
          density="compact"
          class="mb-3"
          color="primary"
          bg-color="surface"
          :disabled="loading || templates.length === 0"
          :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
          :list-props="{ bgColor: 'surface', color: undefined }"
        />

        <v-select
          v-model="diaSemana"
          :items="DAYS"
          label="Día de la semana"
          density="compact"
          color="primary"
          bg-color="surface"
          :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
          :list-props="{ bgColor: 'surface', color: undefined }"
        />
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!templateId || loading"
          @click="handleSubmit"
        >
          Asignar copia
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
