<script setup>
/**
 * Password change: collapsed to a single button; form only when requested.
 */
import { reactive, shallowRef } from 'vue';

const props = defineProps({
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit']);

const open = shallowRef(false);

const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

const localError = shallowRef('');

function resetForm() {
  form.current_password = '';
  form.new_password = '';
  form.confirm_password = '';
  localError.value = '';
}

function openForm() {
  resetForm();
  open.value = true;
}

function cancel() {
  resetForm();
  open.value = false;
}

function onSubmit() {
  localError.value = '';
  if (!form.current_password || !form.new_password) {
    localError.value = 'Completa ambos campos de contraseña.';
    return;
  }
  if (form.new_password.length < 6) {
    localError.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }
  if (form.new_password !== form.confirm_password) {
    localError.value = 'La confirmación no coincide.';
    return;
  }
  emit('submit', {
    current_password: form.current_password,
    new_password: form.new_password,
    done: (ok) => {
      if (ok) {
        resetForm();
        open.value = false;
      }
    },
  });
}
</script>

<template>
  <section class="password-panel" aria-label="Cambiar contraseña">
    <div v-if="!open" class="password-collapsed">
      <v-btn
        color="primary"
        variant="tonal"
        block
        prepend-icon="mdi-lock-outline"
        @click="openForm"
      >
        Cambiar contraseña
      </v-btn>
    </div>

    <div v-else class="password-form">
      <div class="password-form__header">
        <h2 class="password-form__title">Cambiar contraseña</h2>
        <v-btn variant="text" size="small" color="var(--tf-on-surface-muted, #a8b0bc)" :disabled="saving" @click="cancel">
          Cancelar
        </v-btn>
      </div>

      <v-text-field
        v-model="form.current_password"
        label="Contraseña actual"
        type="password"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        autocomplete="current-password"
      />
      <v-text-field
        v-model="form.new_password"
        label="Nueva contraseña"
        type="password"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        autocomplete="new-password"
      />
      <v-text-field
        v-model="form.confirm_password"
        label="Confirmar nueva contraseña"
        type="password"
        variant="outlined"
        density="comfortable"
        class="mb-2"
        autocomplete="new-password"
      />
      <p v-if="localError" class="text-caption text-error mb-3">{{ localError }}</p>

      <div class="password-form__actions">
        <v-btn variant="text" class="tf-btn-muted" :disabled="saving" @click="cancel">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          class="font-weight-bold"
          :loading="saving"
          @click="onSubmit"
        >
          Guardar
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.password-panel {
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.password-collapsed {
  padding: 14px;
}

.password-form {
  padding: 16px;
}

.password-form__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.password-form__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.password-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
