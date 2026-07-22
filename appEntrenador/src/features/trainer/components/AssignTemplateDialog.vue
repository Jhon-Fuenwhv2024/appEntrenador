<script setup>
import { onMounted, ref, shallowRef, watch } from 'vue';
import { getClients } from '../api/clientsApi.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  /** Prefill day when assigning from a client routine context */
  defaultDay: {
    type: String,
    default: 'Lunes',
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const clients = ref([]);
const loadingClients = shallowRef(false);
const clientId = shallowRef(null);
const diaSemana = shallowRef('Lunes');
const loadError = shallowRef('');

const loadClients = async () => {
  try {
    loadingClients.value = true;
    loadError.value = '';
    const response = await getClients();
    if (response.data.success) {
      clients.value = response.data.clients ?? [];
    } else {
      clients.value = [];
      loadError.value = response.data.error || 'No se pudieron cargar los alumnos';
    }
  } catch (error) {
    clients.value = [];
    loadError.value = error?.response?.data?.error || 'Error al cargar alumnos';
  } finally {
    loadingClients.value = false;
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    clientId.value = null;
    diaSemana.value = DAYS.includes(props.defaultDay) ? props.defaultDay : 'Lunes';
    loadClients();
  },
);

onMounted(() => {
  if (props.modelValue) loadClients();
});

const close = () => {
  emit('update:modelValue', false);
};

const handleSubmit = () => {
  if (!clientId.value) return;
  emit('submit', {
    clientId: Number(clientId.value),
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
        <span>Asignar plantilla</span>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Cerrar" @click="close" />
      </v-card-title>

      <v-card-text>
        <p v-if="template" class="text-medium-emphasis mb-4">
          Se creará una <strong>copia independiente</strong> de
          “{{ template.name }}” en el alumno. Editar la plantilla después no cambia esa rutina.
        </p>

        <v-progress-linear
          v-if="loadingClients"
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

        <v-select
          v-model="clientId"
          :items="clients"
          item-title="nombre"
          item-value="id"
          label="Alumno"
          density="compact"
          class="mb-3"
          color="primary"
          bg-color="surface"
          :disabled="loadingClients || clients.length === 0"
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
          :disabled="!clientId || loadingClients"
          @click="handleSubmit"
        >
          Asignar copia
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
