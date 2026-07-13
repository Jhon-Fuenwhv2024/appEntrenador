<script setup>
import { reactive, watch } from 'vue';

const MEDIA_TYPES = [
  { title: 'Sin media', value: 'none' },
  { title: 'Imagen', value: 'image' },
  { title: 'GIF', value: 'gif' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Video', value: 'video' },
];

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Piernas',
  'Bíceps',
  'Tríceps',
  'Core',
  'Glúteos',
  'Gemelos',
  'General',
];

const props = defineProps({
  saving: { type: Boolean, default: false },
  editingExercise: { type: Object, default: null },
});

const emit = defineEmits(['submit', 'cancel-edit']);

const form = reactive({
  name: '',
  target_muscle: 'General',
  description: '',
  media_type: 'none',
  media_url: '',
});

const isEditing = () => Boolean(props.editingExercise?.id);

const resetForm = () => {
  form.name = '';
  form.target_muscle = 'General';
  form.description = '';
  form.media_type = 'none';
  form.media_url = '';
};

watch(
  () => props.editingExercise,
  (exercise) => {
    if (exercise) {
      form.name = exercise.name || '';
      form.target_muscle = exercise.target_muscle || 'General';
      form.description = exercise.description || '';
      form.media_type = exercise.media_type || 'none';
      form.media_url = exercise.media_url || '';
      return;
    }
    resetForm();
  },
  { immediate: true },
);

watch(
  () => form.media_type,
  (type) => {
    if (type === 'none') form.media_url = '';
  },
);

const handleSubmit = () => {
  const name = form.name.trim();
  if (!name) return;

  emit('submit', {
    name,
    target_muscle: form.target_muscle,
    description: form.description.trim() || null,
    media_type: form.media_type,
    media_url: form.media_type === 'none' ? null : (form.media_url.trim() || null),
  });
};

const handleCancelEdit = () => {
  emit('cancel-edit');
  resetForm();
};

defineExpose({ resetForm });
</script>

<template>
  <form class="catalog-form" @submit.prevent="handleSubmit">
    <h3 class="card-section-title mb-4">
      {{ isEditing() ? 'Editar ejercicio' : 'Nuevo ejercicio' }}
    </h3>

    <v-chip
      v-if="editingExercise?.is_global"
      size="small"
      color="cyan"
      variant="tonal"
      class="mb-3"
    >
      Global del sistema
    </v-chip>

    <v-text-field
      v-model="form.name"
      label="Nombre"
      density="compact"
      class="mb-3"
      required
      :disabled="props.saving"
    />

    <v-select
      v-model="form.target_muscle"
      :items="MUSCLE_GROUPS"
      label="Grupo muscular"
      density="compact"
      class="mb-3"
      :disabled="props.saving"
    />

    <v-textarea
      v-model="form.description"
      label="Descripción (opcional)"
      density="compact"
      rows="2"
      auto-grow
      class="mb-3"
      :disabled="props.saving"
    />

    <v-select
      v-model="form.media_type"
      :items="MEDIA_TYPES"
      item-title="title"
      item-value="value"
      label="Tipo de media"
      density="compact"
      class="mb-3"
      :disabled="props.saving"
    />

    <v-text-field
      v-if="form.media_type !== 'none'"
      v-model="form.media_url"
      label="URL de media (GIF, YouTube, imagen o video)"
      density="compact"
      class="mb-4"
      :disabled="props.saving"
      hint="Pega el enlace completo"
      persistent-hint
    />

    <v-btn
      type="submit"
      color="#00E5FF"
      class="text-black font-weight-bold"
      block
      :loading="props.saving"
      :disabled="!form.name.trim()"
    >
      {{ isEditing() ? 'Guardar cambios' : 'Guardar en mi catálogo' }}
    </v-btn>

    <v-btn
      v-if="isEditing()"
      type="button"
      variant="text"
      class="mt-2"
      block
      :disabled="props.saving"
      @click="handleCancelEdit"
    >
      Cancelar edición
    </v-btn>
  </form>
</template>

<style scoped>
.card-section-title {
  font-size: 1.1rem;
  font-weight: 700;
}
</style>
