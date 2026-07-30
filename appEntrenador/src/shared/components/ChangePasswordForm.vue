<script setup>
/**
 * Password change: collapsed to a settings row; form expands when requested.
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
  <section class="tf-security" aria-label="Cambiar contraseña">
    <button
      v-if="!open"
      type="button"
      class="tf-security__row"
      @click="openForm"
    >
      <span class="tf-security__icon" aria-hidden="true">
        <v-icon icon="mdi-lock-outline" size="18" />
      </span>
      <span class="tf-security__copy">
        <span class="tf-security__title">Cambiar contraseña</span>
        <span class="tf-security__desc">Actualiza el acceso a tu cuenta</span>
      </span>
      <v-icon
        icon="mdi-chevron-right"
        size="20"
        class="tf-security__chevron"
        aria-hidden="true"
      />
    </button>

    <div v-else class="tf-security__form">
      <div class="tf-security__form-header">
        <h3 class="tf-security__form-title">Cambiar contraseña</h3>
        <v-btn
          variant="text"
          size="small"
          color="var(--tf-on-surface-muted, #a8b0bc)"
          :disabled="saving"
          aria-label="Cancelar cambio de contraseña"
          @click="cancel"
        >
          Cancelar
        </v-btn>
      </div>

      <v-text-field
        v-model="form.current_password"
        label="Contraseña actual"
        type="password"
        variant="solo-filled"
        density="comfortable"
        flat
        class="mb-3 tf-security__field"
        autocomplete="current-password"
        hide-details="auto"
      />
      <v-text-field
        v-model="form.new_password"
        label="Nueva contraseña"
        type="password"
        variant="solo-filled"
        density="comfortable"
        flat
        class="mb-3 tf-security__field"
        autocomplete="new-password"
        hide-details="auto"
      />
      <v-text-field
        v-model="form.confirm_password"
        label="Confirmar nueva contraseña"
        type="password"
        variant="solo-filled"
        density="comfortable"
        flat
        class="mb-2 tf-security__field"
        autocomplete="new-password"
        hide-details="auto"
      />
      <p v-if="localError" class="tf-security__error" role="alert">
        {{ localError }}
      </p>

      <div class="tf-security__actions">
        <v-btn
          variant="text"
          :disabled="saving"
          @click="cancel"
        >
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
.tf-security {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%),
    #151820;
  overflow: hidden;
}

.tf-security__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 64px;
  padding: 0.9rem 1rem;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.tf-security__row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.tf-security__row:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: -2px;
}

.tf-security__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-security__copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.tf-security__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8ecf1);
  line-height: 1.3;
}

.tf-security__desc {
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-security__chevron {
  flex-shrink: 0;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-security__form {
  padding: 1rem 1.05rem 1.05rem;
}

.tf-security__form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.85rem;
}

.tf-security__form-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-security__field :deep(.v-field) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: none !important;
}

.tf-security__field :deep(.v-field__overlay) {
  opacity: 0 !important;
}

.tf-security__field:focus-within :deep(.v-field) {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: 2px;
}

.tf-security__error {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: var(--tf-error, #ff5252);
}

.tf-security__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 0.35rem;
}
</style>
