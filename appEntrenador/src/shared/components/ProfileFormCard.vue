<script setup>
/**
 * Profile overview (read-first) with optional edit mode.
 * Default: compact collapsible summary; edit form only when requested.
 */
import { computed, reactive, shallowRef, watch } from 'vue';
import { resolveAvatarSrc } from '../utils/avatar.js';

const SEX_OPTIONS = ['Masculino', 'Femenino', 'Otro'];

const props = defineProps({
  profile: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Perfil',
  },
});

const emit = defineEmits(['save']);

const editing = shallowRef(false);

const form = reactive({
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  sexo: '',
  lesiones: '',
  objetivo: '',
});

const fotoFile = shallowRef(null);
const previewObjectUrl = shallowRef('');

const avatarSrc = computed(() => {
  if (previewObjectUrl.value) return previewObjectUrl.value;
  return resolveAvatarSrc(props.profile?.foto_url);
});

const displayName = computed(() => props.profile?.nombre || 'Alumno');

const facts = computed(() => {
  const p = props.profile || {};
  return [
    {
      key: 'email',
      label: 'Correo',
      icon: 'mdi-email-outline',
      value: p.email || null,
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      icon: 'mdi-phone-outline',
      value: p.telefono || null,
    },
    {
      key: 'objetivo',
      label: 'Objetivo',
      icon: 'mdi-target',
      value: p.objetivo || null,
    },
    {
      key: 'fecha_nacimiento',
      label: 'Nacimiento',
      icon: 'mdi-cake-variant-outline',
      value: formatBirthdate(p.fecha_nacimiento),
    },
    {
      key: 'sexo',
      label: 'Sexo',
      icon: 'mdi-gender-male-female',
      value: p.sexo || null,
    },
  ];
});

const hasAnyData = computed(() => facts.value.some((f) => f.value)
  || Boolean(props.profile?.lesiones?.trim())
  || Boolean(props.profile?.foto_url));

const lesionesText = computed(() => {
  const text = props.profile?.lesiones?.trim();
  return text || null;
});

function formatBirthdate(value) {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split('-');
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}`;
}

function syncFormFromProfile(profile) {
  form.email = profile?.email || '';
  form.telefono = profile?.telefono || '';
  form.fecha_nacimiento = profile?.fecha_nacimiento
    ? String(profile.fecha_nacimiento).slice(0, 10)
    : '';
  form.sexo = profile?.sexo || '';
  form.lesiones = profile?.lesiones || '';
  form.objetivo = profile?.objetivo || '';
  fotoFile.value = null;
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = '';
  }
}

watch(
  () => props.profile,
  (next) => {
    syncFormFromProfile(next);
  },
  { immediate: true },
);

function startEdit() {
  syncFormFromProfile(props.profile);
  editing.value = true;
}

function cancelEdit() {
  syncFormFromProfile(props.profile);
  editing.value = false;
}

function onFileChange(file) {
  const next = Array.isArray(file) ? file[0] : file;
  fotoFile.value = next || null;
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = '';
  }
  if (next instanceof File) {
    previewObjectUrl.value = URL.createObjectURL(next);
  }
}

function onSubmit() {
  emit('save', {
    fields: {
      email: form.email,
      telefono: form.telefono,
      fecha_nacimiento: form.fecha_nacimiento,
      sexo: form.sexo,
      lesiones: form.lesiones,
      objetivo: form.objetivo,
    },
    fotoFile: fotoFile.value,
    done: (ok) => {
      if (ok) editing.value = false;
    },
  });
}
</script>

<template>
  <section class="profile-panel" aria-label="Perfil del alumno">
    <!-- VIEW MODE: compact header + collapsible details (closed by default) -->
    <div v-if="!editing" class="profile-view">
      <v-expansion-panels variant="accordion" class="profile-panels" bg-color="transparent">
        <v-expansion-panel class="profile-exp-panel" elevation="0">
          <v-expansion-panel-title class="profile-exp-title">
            <div class="profile-title-row">
              <v-avatar size="48" class="profile-view__avatar">
                <v-img :src="avatarSrc" :alt="`Foto de ${displayName}`" cover />
              </v-avatar>

              <div class="profile-view__identity min-width-0">
                <p class="profile-view__eyebrow">{{ title }}</p>
                <h2 class="profile-view__name">{{ displayName }}</h2>
                <p v-if="profile?.username" class="profile-view__handle">
                  @{{ profile.username }}
                </p>
              </div>

              <span class="profile-title-hint">
                Ver detalles del perfil
              </span>

              <v-btn
                class="profile-view__edit"
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-pencil-outline"
                @click.stop="startEdit"
              >
                Editar
              </v-btn>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text class="profile-exp-text">
            <div v-if="!hasAnyData" class="profile-view__empty">
              <v-icon icon="mdi-account-details-outline" size="22" class="mb-2" />
              <p class="mb-1">Aún no hay datos de perfil</p>
              <p class="text-caption text-medium-emphasis mb-3">
                Correo, teléfono, objetivo, lesiones y foto se verán aquí cuando los completes.
              </p>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                class="font-weight-bold"
                @click="startEdit"
              >
                Completar perfil
              </v-btn>
            </div>

            <template v-else>
              <div class="profile-facts">
                <div
                  v-for="fact in facts"
                  :key="fact.key"
                  class="profile-fact"
                >
                  <div class="profile-fact__icon" aria-hidden="true">
                    <v-icon :icon="fact.icon" size="18" />
                  </div>
                  <div class="profile-fact__body min-width-0">
                    <div class="profile-fact__label">{{ fact.label }}</div>
                    <div
                      class="profile-fact__value"
                      :class="{ 'profile-fact__value--muted': !fact.value }"
                    >
                      {{ fact.value || 'Sin registrar' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="profile-note">
                <div class="profile-note__label">
                  <v-icon icon="mdi-medical-bag" size="16" class="mr-1" />
                  Lesiones / consideraciones
                </div>
                <p
                  class="profile-note__text"
                  :class="{ 'profile-note__text--muted': !lesionesText }"
                >
                  {{ lesionesText || 'Ninguna registrada' }}
                </p>
              </div>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- EDIT MODE -->
    <div v-else class="profile-edit">
      <div class="profile-edit__header">
        <div>
          <p class="profile-view__eyebrow mb-0">Editar perfil</p>
          <h2 class="profile-edit__title">{{ displayName }}</h2>
        </div>
        <v-btn
          variant="text"
          size="small"
          color="#8B929E"
          @click="cancelEdit"
        >
          Cancelar
        </v-btn>
      </div>

      <div class="profile-edit__avatar-row">
        <v-avatar size="72" class="profile-view__avatar">
          <v-img :src="avatarSrc" :alt="`Foto de ${displayName}`" cover />
        </v-avatar>
        <v-file-input
          :model-value="fotoFile"
          label="Cambiar foto"
          accept="image/jpeg,image/png,image/webp,image/gif"
          prepend-icon="mdi-camera-outline"
          variant="outlined"
          density="compact"
          hide-details
          show-size
          clearable
          class="flex-grow-1"
          @update:model-value="onFileChange"
        />
      </div>

      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            variant="outlined"
            density="compact"
            autocomplete="email"
            hint="Necesario para recuperar la contraseña"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.telefono"
            label="Teléfono"
            variant="outlined"
            density="compact"
            autocomplete="tel"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.fecha_nacimiento"
            label="Fecha de nacimiento"
            type="date"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.sexo"
            :items="SEX_OPTIONS"
            label="Sexo"
            variant="outlined"
            density="compact"
            clearable
            :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
            :list-props="{ bgColor: 'surface', color: undefined }"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.objetivo"
            label="Objetivo"
            variant="outlined"
            density="compact"
            maxlength="100"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.lesiones"
            label="Lesiones / consideraciones"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
          />
        </v-col>
      </v-row>

      <div class="profile-edit__actions">
        <v-btn
          variant="text"
          class="tf-btn-muted"
          :disabled="saving"
          @click="cancelEdit"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          class="font-weight-bold"
          :loading="saving"
          @click="onSubmit"
        >
          Guardar cambios
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-panel {
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(0, 229, 255, 0.08), transparent 55%),
    rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.profile-view {
  padding: 0;
}

.profile-edit {
  padding: 16px;
}

@media (min-width: 600px) {
  .profile-edit {
    padding: 20px;
  }
}

.profile-panels {
  background: transparent !important;
}

.profile-exp-panel {
  background: transparent !important;
  color: inherit;
}

.profile-exp-title {
  padding: 12px 14px !important;
  min-height: 0 !important;
}

.profile-exp-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 14px 14px;
}

.profile-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding-right: 4px;
}

.profile-view__avatar {
  flex-shrink: 0;
  border: 2px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.08);
}

.profile-view__identity {
  min-width: 0;
  flex: 1;
}

.profile-title-hint {
  display: none;
  flex-shrink: 0;
  font-size: 0.75rem;
  color: #8B929E;
  white-space: nowrap;
}

.profile-view__edit {
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .profile-title-hint {
    display: inline;
  }
}

.profile-view__eyebrow {
  margin: 0 0 2px;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00E5FF;
}

.profile-view__name,
.profile-edit__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.profile-view__handle {
  margin: 1px 0 0;
  color: #8B929E;
  font-size: 0.8rem;
}

.profile-view__empty {
  text-align: center;
  padding: 16px 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: #C5CAD3;
}

.profile-facts {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 600px) {
  .profile-facts {
    grid-template-columns: 1fr 1fr;
  }
}

.profile-fact {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
  padding: 12px;
  border-radius: 14px;
  background: rgba(11, 13, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.profile-fact__icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(0, 229, 255, 0.1);
  color: #00E5FF;
}

.profile-fact__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8B929E;
  margin-bottom: 2px;
}

.profile-fact__value {
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
  overflow-wrap: anywhere;
}

.profile-fact__value--muted,
.profile-note__text--muted {
  color: #8B929E;
  font-weight: 500;
}

.profile-note {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(11, 13, 18, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.profile-note__label {
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8B929E;
  margin-bottom: 6px;
}

.profile-note__text {
  margin: 0;
  color: #C5CAD3;
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.profile-edit__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.profile-edit__avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.profile-edit__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.profile-panels :deep(.v-expansion-panel),
.profile-panels :deep(.v-expansion-panel__shadow) {
  background: transparent;
  box-shadow: none !important;
}

.profile-panels :deep(.v-expansion-panel-title__overlay) {
  opacity: 0 !important;
}

.profile-panels :deep(.v-expansion-panel-title:hover) {
  background: rgba(0, 229, 255, 0.04);
}

.profile-panels :deep(.v-expansion-panel-title--active) {
  background: rgba(0, 229, 255, 0.06);
}
</style>
