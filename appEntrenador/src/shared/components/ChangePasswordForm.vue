<script setup>
import { reactive, shallowRef } from 'vue';

const props = defineProps({
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit']);

const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

const localError = shallowRef('');

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
        form.current_password = '';
        form.new_password = '';
        form.confirm_password = '';
      }
    },
  });
}
</script>

<template>
  <v-card class="password-card" variant="flat" rounded="lg">
    <v-card-title class="password-card__title">
      Seguridad
    </v-card-title>
    <v-card-subtitle class="pb-2">
      Cambia tu contraseña. Seguirás con la sesión activa.
    </v-card-subtitle>
    <v-card-text>
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
      <p v-if="localError" class="text-caption text-error mb-0">{{ localError }}</p>
    </v-card-text>
    <v-card-actions class="px-4 pb-4">
      <v-btn
        color="primary"
        class="font-weight-bold"
        block
        :loading="saving"
        @click="onSubmit"
      >
        Actualizar contraseña
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.password-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.password-card__title {
  font-size: 1.05rem;
  font-weight: 700;
}
</style>
