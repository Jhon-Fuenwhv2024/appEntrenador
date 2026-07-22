<script setup>
/**
 * Trainer account profile: compact collapsible view + edit (nombre, telefono, foto).
 */
import { computed, reactive, shallowRef, watch } from 'vue';
import { resolveAvatarSrc } from '../utils/avatar.js';

const props = defineProps({
  account: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['save']);

const editing = shallowRef(false);
const form = reactive({
  nombre: '',
  email: '',
  telefono: '',
});
const fotoFile = shallowRef(null);
const previewObjectUrl = shallowRef('');

const avatarSrc = computed(() => {
  if (previewObjectUrl.value) return previewObjectUrl.value;
  return resolveAvatarSrc(props.account?.foto_url);
});

const displayName = computed(() => props.account?.nombre || 'Entrenador');

const facts = computed(() => [
  {
    key: 'username',
    label: 'Usuario',
    icon: 'mdi-at',
    value: props.account?.username ? `@${props.account.username}` : null,
  },
  {
    key: 'email',
    label: 'Correo',
    icon: 'mdi-email-outline',
    value: props.account?.email || null,
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    icon: 'mdi-phone-outline',
    value: props.account?.telefono || null,
  },
]);

function syncForm(account) {
  form.nombre = account?.nombre || '';
  form.email = account?.email || '';
  form.telefono = account?.telefono || '';
  fotoFile.value = null;
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = '';
  }
}

watch(() => props.account, syncForm, { immediate: true });

function startEdit() {
  syncForm(props.account);
  editing.value = true;
}

function cancelEdit() {
  syncForm(props.account);
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
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
    },
    fotoFile: fotoFile.value,
    done: (ok) => {
      if (ok) editing.value = false;
    },
  });
}
</script>

<template>
  <section class="account-panel" aria-label="Perfil de cuenta">
    <div v-if="!editing" class="account-view">
      <v-expansion-panels variant="accordion" class="account-panels" bg-color="transparent">
        <v-expansion-panel class="account-exp-panel" elevation="0">
          <v-expansion-panel-title class="account-exp-title">
            <div class="account-title-row">
              <v-avatar size="48" class="account-avatar">
                <v-img :src="avatarSrc" :alt="`Foto de ${displayName}`" cover />
              </v-avatar>
              <div class="account-identity min-width-0">
                <p class="account-eyebrow">Mi perfil</p>
                <h2 class="account-name">{{ displayName }}</h2>
                <p v-if="account?.username" class="account-handle">@{{ account.username }}</p>
              </div>
              <span class="account-hint">Ver detalles</span>
              <v-btn
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

          <v-expansion-panel-text>
            <div class="account-facts">
              <div v-for="fact in facts" :key="fact.key" class="account-fact">
                <div class="account-fact__icon">
                  <v-icon :icon="fact.icon" size="18" />
                </div>
                <div class="min-width-0">
                  <div class="account-fact__label">{{ fact.label }}</div>
                  <div
                    class="account-fact__value"
                    :class="{ 'account-fact__value--muted': !fact.value }"
                  >
                    {{ fact.value || 'Sin registrar' }}
                  </div>
                </div>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <div v-else class="account-edit">
      <div class="account-edit__header">
        <div>
          <p class="account-eyebrow mb-0">Editar perfil</p>
          <h2 class="account-name">{{ displayName }}</h2>
        </div>
        <v-btn variant="text" size="small" color="var(--tf-on-surface-muted, #a8b0bc)" @click="cancelEdit">
          Cancelar
        </v-btn>
      </div>

      <div class="account-edit__avatar-row">
        <v-avatar size="72" class="account-avatar">
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

      <v-text-field
        v-model="form.nombre"
        label="Nombre"
        variant="outlined"
        density="compact"
        class="mb-3"
      />
      <v-text-field
        :model-value="account?.username || ''"
        label="Usuario"
        variant="outlined"
        density="compact"
        class="mb-3"
        readonly
        hint="El usuario no se puede cambiar"
        persistent-hint
      />
      <v-text-field
        v-model="form.email"
        label="Correo electrónico"
        type="email"
        variant="outlined"
        density="compact"
        class="mb-3"
        autocomplete="email"
        hint="Necesario para recuperar la contraseña"
        persistent-hint
      />
      <v-text-field
        v-model="form.telefono"
        label="Teléfono"
        variant="outlined"
        density="compact"
        class="mb-3"
        autocomplete="tel"
      />

      <div class="account-edit__actions">
        <v-btn variant="text" class="tf-btn-muted" :disabled="saving" @click="cancelEdit">
          Cancelar
        </v-btn>
        <v-btn color="primary" class="font-weight-bold" :loading="saving" @click="onSubmit">
          Guardar cambios
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-panel {
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(0, 229, 255, 0.08), transparent 55%),
    rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.account-edit {
  padding: 16px;
}

.account-panels {
  background: transparent !important;
}

.account-exp-panel {
  background: transparent !important;
}

.account-exp-title {
  padding: 12px 14px !important;
  min-height: 0 !important;
}

.account-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding-right: 4px;
}

.account-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(0, 229, 255, 0.4);
}

.account-identity {
  flex: 1;
  min-width: 0;
}

.account-hint {
  display: none;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  white-space: nowrap;
}

@media (min-width: 600px) {
  .account-hint {
    display: inline;
  }
}

.account-eyebrow {
  margin: 0 0 2px;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00E5FF;
}

.account-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
}

.account-handle {
  margin: 1px 0 0;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.8rem;
}

.account-facts {
  display: grid;
  gap: 10px;
  padding-bottom: 4px;
}

@media (min-width: 600px) {
  .account-facts {
    grid-template-columns: 1fr 1fr;
  }
}

.account-fact {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(11, 13, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.account-fact__icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(0, 229, 255, 0.1);
  color: #00E5FF;
  flex-shrink: 0;
}

.account-fact__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.account-fact__value {
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
}

.account-fact__value--muted {
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-weight: 500;
}

.account-edit__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.account-edit__avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.account-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.account-panels :deep(.v-expansion-panel__shadow) {
  box-shadow: none !important;
}

.account-panels :deep(.v-expansion-panel-title__overlay) {
  opacity: 0 !important;
}

.account-panels :deep(.v-expansion-panel-title:hover) {
  background: rgba(0, 229, 255, 0.04);
}
</style>
