<script setup>
import { computed, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_NAME } from '../../config/app.js';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { resetPassword } from './api/authApi.js';

const route = useRoute();
const router = useRouter();

const password = shallowRef('');
const confirmPassword = shallowRef('');
const showPassword = shallowRef(false);
const showConfirm = shallowRef(false);
const loading = shallowRef(false);
const errorMessage = shallowRef('');
const successMessage = shallowRef('');

const token = computed(() => {
  const value = route.query.token;
  return typeof value === 'string' ? value.trim() : '';
});

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!token.value) {
    errorMessage.value = 'Falta el token de restablecimiento. Solicita un nuevo enlace.';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.';
    return;
  }

  loading.value = true;
  try {
    const response = await resetPassword({
      token: token.value,
      password: password.value,
    });

    if (response.data?.success) {
      successMessage.value =
        response.data.message || 'Contraseña actualizada. Redirigiendo al login…';
      setTimeout(() => {
        router.push('/');
      }, 1800);
      return;
    }

    errorMessage.value = 'No se pudo actualizar la contraseña.';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'No se pudo actualizar la contraseña. El enlace puede haber expirado.',
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-wrapper">
    <v-card class="elevation-24 login-card" color="surface">
      <div class="app-brand">
        <div class="app-brand-icon">
          <AppLogo size="lg" />
        </div>
        <span class="app-brand-name">{{ APP_NAME }}</span>
      </div>
      <h2 class="text-primary font-weight-bold login-title">
        Nueva contraseña
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Elige una contraseña segura para tu cuenta.
      </p>

      <v-card-text>
        <v-alert
          v-if="!token"
          type="warning"
          variant="tonal"
          class="mb-4 text-body-2"
        >
          Enlace incompleto. Abre el enlace del correo o solicita uno nuevo desde el login.
        </v-alert>

        <v-form v-else @submit.prevent="handleSubmit">
          <v-text-field
            v-model="password"
            label="Nueva contraseña"
            prepend-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showPassword ? 'text' : 'password'"
            color="primary"
            required
            density="comfortable"
            hide-details="auto"
            class="login-field"
            autocomplete="new-password"
            :disabled="loading || Boolean(successMessage)"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-text-field
            v-model="confirmPassword"
            label="Confirmar nueva contraseña"
            prepend-icon="mdi-lock-check"
            :append-inner-icon="showConfirm ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showConfirm ? 'text' : 'password'"
            color="primary"
            required
            density="comfortable"
            hide-details="auto"
            class="login-field"
            autocomplete="new-password"
            :disabled="loading || Boolean(successMessage)"
            @click:append-inner="showConfirm = !showConfirm"
          />

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4 text-body-2"
          >
            {{ errorMessage }}
          </v-alert>

          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4 text-body-2"
          >
            {{ successMessage }}
          </v-alert>

          <v-btn
            type="submit"
            block
            color="primary"
            class="font-weight-bold login-submit-btn"
            size="large"
            :loading="loading"
            :disabled="Boolean(successMessage)"
          >
            Guardar contraseña
          </v-btn>

          <v-btn
            block
            variant="text"
            class="mt-3"
            :disabled="loading"
            @click="router.push('/')"
          >
            Volver al login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<style src="../../assets/login.css"></style>
