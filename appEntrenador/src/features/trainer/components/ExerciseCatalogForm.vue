<script setup>
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue';
import { MUSCLE_OPTIONS } from '../../../shared/constants/muscles.js';
import { buildExerciseFormData, MAX_EXERCISE_MEDIA_BYTES } from '../api/exercisesApi.js';

const MEDIA_TYPES = [
  { title: 'Sin media', value: 'none' },
  { title: 'Imagen', value: 'image' },
  { title: 'GIF', value: 'gif' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Video', value: 'video' },
];

const MEDIA_SOURCE_OPTIONS = [
  {
    value: 'url',
    label: 'Enlazar URL',
    hint: 'YouTube o enlace externo',
    icon: 'mdi-link-variant',
  },
  {
    value: 'upload',
    label: 'Subir archivo',
    hint: 'Imagen, GIF o video',
    icon: 'mdi-cloud-upload-outline',
  },
];

const DEFAULT_MUSCLE = 'Full Body';
const FIELD_MENU = { contentClass: 'tf-overlay-menu', maxHeight: 280 };

const props = defineProps({
  saving: { type: Boolean, default: false },
  editingExercise: { type: Object, default: null },
});

const emit = defineEmits(['submit', 'cancel-edit', 'notify']);

const form = reactive({
  name: '',
  target_muscle: DEFAULT_MUSCLE,
  description: '',
  media_type: 'none',
  media_url: '',
  media_source: 'url',
});

/** @type {import('vue').ShallowRef<File|null>} */
const mediaFile = shallowRef(null);
const previewUrl = shallowRef('');
const fileInputKey = shallowRef(0);

const isEditing = computed(() => Boolean(props.editingExercise?.id));
const isGlobalEdit = computed(() => Boolean(props.editingExercise?.is_global));
const uploadAllowed = computed(() => !isGlobalEdit.value);

const formTitle = computed(() => (
  isEditing.value ? 'Editar ejercicio' : 'Nuevo ejercicio'
));

const formSubtitle = computed(() => (
  isEditing.value
    ? 'Actualiza datos y media de este ejercicio del catálogo.'
    : 'Añade un ejercicio propio a tu catálogo privado.'
));

const submitLabel = computed(() => (
  isEditing.value ? 'Guardar cambios' : 'Guardar en mi catálogo'
));

const previewIsVideo = computed(() => {
  const file = mediaFile.value;
  if (!file) return false;
  return String(file.type || '').startsWith('video/');
});

const existingLocalPath = computed(() => {
  const path = props.editingExercise?.local_media_path;
  return typeof path === 'string' && path.trim() ? path.trim() : '';
});

const selectedFileLabel = computed(() => {
  const file = mediaFile.value;
  if (!(file instanceof File)) return '';
  const mb = file.size / (1024 * 1024);
  const size = mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  return `${file.name} · ${size}`;
});

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
  }
}

function clearMediaFile() {
  revokePreview();
  mediaFile.value = null;
  fileInputKey.value += 1;
}

const resetForm = () => {
  form.name = '';
  form.target_muscle = DEFAULT_MUSCLE;
  form.description = '';
  form.media_type = 'none';
  form.media_url = '';
  form.media_source = 'url';
  clearMediaFile();
};

function resolveMuscleForForm(exercise) {
  const primary = exercise?.primary_muscle?.trim();
  if (primary && MUSCLE_OPTIONS.includes(primary)) return primary;
  const target = exercise?.target_muscle?.trim();
  if (target && MUSCLE_OPTIONS.includes(target)) return target;
  return DEFAULT_MUSCLE;
}

function selectMediaSource(value) {
  if (value === 'upload' && !uploadAllowed.value) return;
  form.media_source = value;
}

watch(
  () => props.editingExercise,
  (exercise) => {
    if (exercise) {
      form.name = exercise.name || '';
      form.target_muscle = resolveMuscleForForm(exercise);
      form.description = exercise.description || '';
      form.media_type = exercise.media_type || 'none';
      form.media_url = exercise.media_url || '';
      if (exercise.is_global) {
        form.media_source = 'url';
      } else if (exercise.local_media_path && !exercise.media_url) {
        form.media_source = 'upload';
      } else {
        form.media_source = 'url';
      }
      clearMediaFile();
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

watch(
  () => form.media_source,
  (source) => {
    if (source === 'url') {
      clearMediaFile();
    }
  },
);

watch(mediaFile, (file) => {
  revokePreview();
  if (file instanceof File) {
    previewUrl.value = URL.createObjectURL(file);
  }
});

onBeforeUnmount(() => {
  revokePreview();
});

function onFileChange(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!(raw instanceof File)) {
    clearMediaFile();
    return;
  }

  if (raw.size > MAX_EXERCISE_MEDIA_BYTES) {
    clearMediaFile();
    emit('notify', {
      text: 'El archivo supera el límite de 10 MB.',
      color: 'error',
    });
    return;
  }

  mediaFile.value = raw;
}

const handleSubmit = () => {
  const name = form.name.trim();
  if (!name) return;

  if (form.media_source === 'upload' && !uploadAllowed.value) {
    emit('notify', {
      text: 'Los ejercicios globales solo admiten URL. Crea un ejercicio propio para subir archivo.',
      color: 'error',
    });
    return;
  }

  const fields = {
    name,
    target_muscle: form.target_muscle,
    primary_muscle: form.target_muscle,
    description: form.description.trim() || null,
  };

  if (form.media_source === 'upload') {
    const file = mediaFile.value;
    if (!file && !existingLocalPath.value) {
      emit('notify', {
        text: 'Selecciona un archivo de imagen o video.',
        color: 'error',
      });
      return;
    }

    if (file instanceof File) {
      if (file.size > MAX_EXERCISE_MEDIA_BYTES) {
        emit('notify', {
          text: 'El archivo supera el límite de 10 MB.',
          color: 'error',
        });
        return;
      }
      emit('submit', buildExerciseFormData(fields, file));
      return;
    }

    emit('submit', {
      ...fields,
      media_type: props.editingExercise?.media_type || 'gif',
      media_url: null,
    });
    return;
  }

  emit('submit', {
    ...fields,
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
  <form
    class="exercise-form"
    aria-labelledby="exercise-form-title"
    @submit.prevent="handleSubmit"
  >
    <header class="exercise-form__header">
      <div class="exercise-form__heading">
        <h3
          id="exercise-form-title"
          class="exercise-form__title"
        >
          {{ formTitle }}
        </h3>
        <p class="exercise-form__subtitle">
          {{ formSubtitle }}
        </p>
      </div>
      <v-chip
        v-if="editingExercise?.is_global"
        size="small"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-earth"
      >
        Global
      </v-chip>
    </header>

    <section
      class="exercise-form__section"
      aria-labelledby="exercise-form-data-label"
    >
      <h4
        id="exercise-form-data-label"
        class="exercise-form__section-label"
      >
        Datos del ejercicio
      </h4>

      <v-text-field
        v-model="form.name"
        label="Nombre"
        placeholder="Ej. Press banca con mancuernas"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        class="exercise-form__field"
        required
        :disabled="saving"
      />

      <v-select
        v-model="form.target_muscle"
        :items="MUSCLE_OPTIONS"
        label="Grupo muscular"
        variant="outlined"
        density="comfortable"
        color="primary"
        bg-color="surface"
        hide-details="auto"
        class="exercise-form__field"
        :menu-props="FIELD_MENU"
        :disabled="saving"
      />

      <v-textarea
        v-model="form.description"
        label="Descripción (opcional)"
        placeholder="Indicaciones, setup o tips para el alumno"
        variant="outlined"
        density="comfortable"
        color="primary"
        rows="2"
        auto-grow
        hide-details="auto"
        class="exercise-form__field"
        :disabled="saving"
      />
    </section>

    <section
      class="exercise-form__section"
      aria-labelledby="exercise-form-media-label"
    >
      <h4
        id="exercise-form-media-label"
        class="exercise-form__section-label"
      >
        Media demostrativa
      </h4>

      <div
        class="media-source"
        role="radiogroup"
        aria-label="Origen de media"
      >
        <button
          v-for="opt in MEDIA_SOURCE_OPTIONS"
          :key="opt.value"
          type="button"
          class="media-source__option"
          :class="{
            'media-source__option--active': form.media_source === opt.value,
            'media-source__option--disabled': opt.value === 'upload' && !uploadAllowed,
          }"
          role="radio"
          :aria-checked="form.media_source === opt.value"
          :disabled="saving || (opt.value === 'upload' && !uploadAllowed)"
          @click="selectMediaSource(opt.value)"
        >
          <v-icon
            class="media-source__icon"
            :icon="opt.icon"
            size="22"
            aria-hidden="true"
          />
          <span class="media-source__text">
            <span class="media-source__title">{{ opt.label }}</span>
            <span class="media-source__hint">{{ opt.hint }}</span>
          </span>
        </button>
      </div>

      <p
        v-if="isGlobalEdit"
        class="exercise-form__note"
      >
        Los ejercicios globales solo admiten enlace URL. Crea uno propio para subir archivo.
      </p>

      <div
        v-if="form.media_source === 'url'"
        class="exercise-form__media-panel"
      >
        <v-select
          v-model="form.media_type"
          :items="MEDIA_TYPES"
          item-title="title"
          item-value="value"
          label="Tipo de media"
          variant="outlined"
          density="comfortable"
          color="primary"
          bg-color="surface"
          hide-details="auto"
          class="exercise-form__field"
          :menu-props="FIELD_MENU"
          :disabled="saving"
        />

        <v-text-field
          v-if="form.media_type !== 'none'"
          v-model="form.media_url"
          label="URL de media"
          placeholder="https://…"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details="auto"
          class="exercise-form__field"
          prepend-inner-icon="mdi-link"
          hint="Pega el enlace completo (GIF, YouTube, imagen o video)"
          persistent-hint
          :disabled="saving"
        />
      </div>

      <div
        v-else
        class="exercise-form__media-panel"
      >
        <div
          class="upload-zone"
          :class="{
            'upload-zone--filled': Boolean(mediaFile) || Boolean(existingLocalPath),
            'upload-zone--disabled': saving || !uploadAllowed,
          }"
        >
          <v-file-input
            :key="fileInputKey"
            class="upload-zone__input"
            label="Arrastra o elige un archivo"
            accept="image/*,video/*"
            variant="outlined"
            density="comfortable"
            color="primary"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            show-size
            clearable
            hide-details="auto"
            :disabled="saving || !uploadAllowed"
            @update:model-value="onFileChange"
          />
          <p class="upload-zone__meta">
            Máximo 10 MB · JPEG, PNG, WebP, GIF, MP4 o WebM
          </p>
          <p
            v-if="selectedFileLabel"
            class="upload-zone__file"
          >
            {{ selectedFileLabel }}
          </p>
          <p
            v-else-if="existingLocalPath && !mediaFile"
            class="upload-zone__file"
          >
            Media actual hosteada · elige un archivo para reemplazarla
          </p>
        </div>

        <div
          v-if="previewUrl"
          class="media-preview"
        >
          <span class="media-preview__badge">Vista previa</span>
          <video
            v-if="previewIsVideo"
            class="media-preview__el"
            :src="previewUrl"
            autoplay
            loop
            muted
            playsinline
          />
          <img
            v-else
            class="media-preview__el"
            :src="previewUrl"
            alt="Vista previa del archivo"
          >
        </div>
      </div>
    </section>

    <div class="exercise-form__actions">
      <v-btn
        type="submit"
        color="primary"
        class="exercise-form__submit font-weight-bold"
        block
        size="large"
        :loading="saving"
        :disabled="!form.name.trim()"
      >
        {{ submitLabel }}
      </v-btn>

      <v-btn
        v-if="isEditing"
        type="button"
        variant="outlined"
        block
        class="exercise-form__cancel"
        :disabled="saving"
        @click="handleCancelEdit"
      >
        Cancelar edición
      </v-btn>
    </div>
  </form>
</template>

<style scoped>
.exercise-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.exercise-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.exercise-form__heading {
  min-width: 0;
}

.exercise-form__title {
  margin: 0;
  font-size: var(--tf-text-xl, 1.375rem);
  font-weight: 700;
  line-height: 1.25;
  color: var(--tf-on-surface, #fff);
  letter-spacing: -0.01em;
}

.exercise-form__subtitle {
  margin: 0.35rem 0 0;
  font-size: var(--tf-text-sm, 0.75rem);
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.exercise-form__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--tf-border, rgba(255, 255, 255, 0.28));
}

.exercise-form__section-label {
  margin: 0 0 0.15rem;
  font-size: var(--tf-text-xs, 0.6875rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.exercise-form__field {
  margin: 0;
}

.exercise-form__note {
  margin: 0;
  font-size: var(--tf-text-sm, 0.75rem);
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.exercise-form__media-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.media-source {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.media-source__option {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--tf-border, rgba(255, 255, 255, 0.28));
  background: var(--tf-surface, #1e1e1e);
  color: var(--tf-on-surface, #fff);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.media-source__option:hover:not(:disabled) {
  background: var(--tf-menu-hover, rgba(0, 229, 255, 0.16));
  border-color: rgba(0, 229, 255, 0.45);
}

.media-source__option:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.media-source__option--active {
  border-color: var(--tf-primary, #00e5ff);
  background: rgba(0, 229, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(0, 229, 255, 0.35);
}

.media-source__option--disabled,
.media-source__option:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.media-source__icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--tf-primary, #00e5ff);
}

.media-source__text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.media-source__title {
  font-size: var(--tf-text-md, 0.875rem);
  font-weight: 700;
  line-height: 1.2;
}

.media-source__hint {
  font-size: var(--tf-text-xs, 0.6875rem);
  line-height: 1.3;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.upload-zone {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.85rem;
  border-radius: 0.75rem;
  border: 1px dashed rgba(0, 229, 255, 0.4);
  background: rgba(0, 229, 255, 0.05);
}

.upload-zone--filled {
  border-style: solid;
  border-color: rgba(0, 229, 255, 0.55);
}

.upload-zone--disabled {
  opacity: 0.55;
}

.upload-zone__input {
  margin: 0;
}

.upload-zone__meta,
.upload-zone__file {
  margin: 0;
  font-size: var(--tf-text-xs, 0.6875rem);
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.upload-zone__file {
  color: var(--tf-on-surface, #fff);
  word-break: break-word;
}

.media-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  max-height: 14rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 229, 255, 0.25);
  background:
    linear-gradient(160deg, rgba(0, 229, 255, 0.08), transparent 55%),
    var(--tf-surface-elevated, #2a2a2a);
}

.media-preview__badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 1;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  font-size: var(--tf-text-xs, 0.6875rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
}

.media-preview__el {
  display: block;
  max-width: 100%;
  max-height: 14rem;
  object-fit: contain;
}

.exercise-form__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.15rem;
}

.exercise-form__submit :deep(.v-btn__content) {
  color: var(--tf-on-primary, #0b0d12);
}

.exercise-form__cancel {
  border-color: var(--tf-border, rgba(255, 255, 255, 0.28)) !important;
}

@media (max-width: 390px) {
  .media-source {
    grid-template-columns: 1fr;
  }
}
</style>
