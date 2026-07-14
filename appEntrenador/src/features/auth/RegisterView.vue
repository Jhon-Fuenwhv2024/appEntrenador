<script setup>
import { onMounted, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_NAME } from '../../config/app.js';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession } from '../../shared/auth/session.js';
import { registerClient } from './api/authApi.js';

const route = useRoute();
const router = useRouter();

const nombre = shallowRef('');
const username = shallowRef('');
const password = shallowRef('');
const token = shallowRef('');
const showPassword = shallowRef(false);
const alertMessage = shallowRef('');
const alertType = shallowRef('error');

onMounted(() => {
  // Invite registration is a guest flow: never inherit a trainer/client session from another tab.
  clearSession();

  if (route.query.token) {
    token.value = route.query.token;
    return;
  }

  alertType.value = 'warning';
  alertMessage.value = 'No se encontró un token válido. Necesitas una invitación de tu entrenador.';
});

const handleRegister = async () => {
  if (!token.value) {
    alertType.value = 'error';
    alertMessage.value = 'Falta el token de invitación. Solicita un nuevo enlace.';
    return;
  }

  try {
    alertMessage.value = '';

    const response = await registerClient({
      username: username.value,
      password: password.value,
      nombre: nombre.value,
      token: token.value,
    });

    if (response.data.success) {
      alertType.value = 'success';
      alertMessage.value = response.data.message;
      clearSession();

      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  } catch (error) {
    alertType.value = 'error';
    alertMessage.value = getApiErrorMessage(error, 'Error al conectar con el servidor backend.');
  }
};
</script>

<template>
  <div class="login-wrapper">
    <v-card class="elevation-24 pa-8 login-card" color="surface">
      <div class="app-brand">
        <div class="app-brand-icon">
          <AppLogo size="lg" />
        </div>
        <span class="app-brand-name">{{ APP_NAME }}</span>
      </div>
      <h2 class="text-primary font-weight-bold login-title text-center mb-2">Crear Cuenta</h2>
      <p class="text-body-2 text-center mb-4 text-grey">Completa tus datos para unirte.</p>

      <v-card-text class="px-0 pb-0">
        <v-form @submit.prevent="handleRegister">
          <v-text-field
            v-model="nombre"
            label="Nombre Completo"
            prepend-icon="mdi-badge-account"
            color="primary"
            required
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />

          <v-text-field
            v-model="username"
            label="Usuario (Ej: juanperez)"
            prepend-icon="mdi-account"
            color="primary"
            required
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />

          <v-text-field
            v-model="password"
            label="Contraseña"
            prepend-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showPassword ? 'text' : 'password'"
            color="primary"
            required
            density="comfortable"
            hide-details="auto"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-alert
            v-if="alertMessage"
            :type="alertType"
            variant="tonal"
            class="mt-4 text-body-2"
          >
            {{ alertMessage }}
          </v-alert>

          <v-btn
            type="submit"
            block
            color="primary"
            class="mt-6 font-weight-bold login-submit-btn"
            size="large"
          >
            Registrarse
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<style src="../../assets/login.css" scoped></style>
