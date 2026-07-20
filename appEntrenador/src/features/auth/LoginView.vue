<script setup>
import { shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { APP_NAME } from '../../config/app.js';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { setSession } from '../../shared/auth/session.js';
import { forgotPassword, login } from './api/authApi.js';

const router = useRouter();

const username = shallowRef('');
const password = shallowRef('');
const errorMessage = shallowRef('');
const showPassword = shallowRef(false);

/** confirm | username | done */
const forgotStep = shallowRef('confirm');
const forgotOpen = shallowRef(false);
const forgotUsername = shallowRef('');
const forgotLoading = shallowRef(false);
const forgotMessage = shallowRef('');
const forgotError = shallowRef('');

const GENERIC_FORGOT_SUCCESS =
  'Si la cuenta existe y tiene un correo registrado, te hemos enviado un enlace para restablecer tu contraseña.';

const handleLogin = async () => {
  try {
    errorMessage.value = '';

    const response = await login({
      username: username.value,
      password: password.value,
    });

    const { success, user, token } = response.data || {};

    if (success && token && user) {
      setSession({ user, token });
      router.push('/dashboard');
      return;
    }

    errorMessage.value = success
      ? 'El servidor no devolvió JWT. Reinicia el backend (`cd backend && npm start`) y vuelve a intentar.'
      : 'No se pudo iniciar sesión.';
    console.error('Login incompleto. Claves recibidas:', Object.keys(response.data || {}));
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      'No se pudo conectar con el servidor backend. ¿Está encendido?',
    );
    console.error('Error en el inicio de sesión:', error);
  }
};

function closeForgot() {
  forgotOpen.value = false;
  forgotLoading.value = false;
  forgotMessage.value = '';
  forgotError.value = '';
  forgotStep.value = 'confirm';
  forgotUsername.value = '';
}

function openForgot() {
  forgotMessage.value = '';
  forgotError.value = '';
  forgotLoading.value = false;
  forgotUsername.value = username.value.trim();
  forgotStep.value = 'confirm';
  forgotOpen.value = true;
}

async function sendForgotForUsername(user) {
  forgotLoading.value = true;
  forgotMessage.value = '';
  forgotError.value = '';

  try {
    const response = await forgotPassword({ username: user });
    forgotMessage.value = response.data?.message || GENERIC_FORGOT_SUCCESS;
    forgotStep.value = 'done';
  } catch (error) {
    const status = error?.response?.status;
    if (!status || status >= 500) {
      forgotError.value = getApiErrorMessage(
        error,
        'No se pudo contactar al servidor. Intenta de nuevo.',
      );
    } else {
      forgotMessage.value = GENERIC_FORGOT_SUCCESS;
      forgotStep.value = 'done';
    }
  } finally {
    forgotLoading.value = false;
  }
}

/** Confirm step → Cambiar contraseña */
async function onConfirmChangePassword() {
  const fromLogin = username.value.trim();
  if (fromLogin) {
    forgotUsername.value = fromLogin;
    await sendForgotForUsername(fromLogin);
    return;
  }
  forgotUsername.value = '';
  forgotStep.value = 'username';
}

async function onSubmitForgotUsername() {
  const user = forgotUsername.value.trim();
  if (!user) {
    forgotError.value = 'Indica tu nombre de usuario.';
    return;
  }
  await sendForgotForUsername(user);
}
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
      <h2 class="text-primary font-weight-bold login-title">Iniciar Sesión</h2>

      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="username"
            label="Nombre de Usuario"
            prepend-icon="mdi-account"
            color="primary"
            required
            density="comfortable"
            hide-details="auto"
            class="login-field"
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
            class="login-field"
            @click:append-inner="showPassword = !showPassword"
          />

          <div class="login-forgot-row">
            <button
              type="button"
              class="forgot-link"
              @click="openForgot"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4 text-body-2"
          >
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            block
            color="primary"
            class="font-weight-bold login-submit-btn"
            size="large"
          >
            Entrar
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <v-dialog
      :model-value="forgotOpen"
      max-width="420"
      scrim
      @update:model-value="(v) => { if (!v) closeForgot(); }"
    >
      <v-card color="surface" class="pa-4">
        <!-- Paso 1: confirmación -->
        <template v-if="forgotStep === 'confirm'">
          <v-card-title class="text-h6 px-2 pt-2">
            ¿Restablecer contraseña?
          </v-card-title>
          <v-card-text class="px-2">
            <p class="text-body-2 text-medium-emphasis mb-0">
              ¿Seguro que quieres cambiar tu contraseña? Te enviaremos un enlace
              al correo registrado en tu cuenta.
            </p>
          </v-card-text>
          <v-card-actions class="px-2 pb-2">
            <v-spacer />
            <v-btn variant="text" :disabled="forgotLoading" @click="closeForgot">
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              class="font-weight-bold"
              :loading="forgotLoading"
              @click="onConfirmChangePassword"
            >
              Cambiar contraseña
            </v-btn>
          </v-card-actions>
        </template>

        <!-- Paso 2: pedir username si no venía del login -->
        <template v-else-if="forgotStep === 'username'">
          <v-card-title class="text-h6 px-2 pt-2">
            Indica tu usuario
          </v-card-title>
          <v-card-text class="px-2">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Escribe el nombre de usuario de tu cuenta. Buscaremos el correo
              registrado y te enviaremos el enlace.
            </p>
            <v-text-field
              v-model="forgotUsername"
              label="Nombre de usuario"
              prepend-icon="mdi-account"
              color="primary"
              density="comfortable"
              hide-details="auto"
              autocomplete="username"
              :disabled="forgotLoading"
              @keyup.enter="onSubmitForgotUsername"
            />
            <v-alert
              v-if="forgotError"
              type="error"
              variant="tonal"
              class="mt-4 text-body-2"
            >
              {{ forgotError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-2 pb-2">
            <v-spacer />
            <v-btn variant="text" :disabled="forgotLoading" @click="closeForgot">
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              class="font-weight-bold"
              :loading="forgotLoading"
              :disabled="!forgotUsername.trim()"
              @click="onSubmitForgotUsername"
            >
              Enviar enlace
            </v-btn>
          </v-card-actions>
        </template>

        <!-- Paso 3: resultado -->
        <template v-else>
          <v-card-title class="text-h6 px-2 pt-2">
            Revisar correo
          </v-card-title>
          <v-card-text class="px-2">
            <v-alert type="success" variant="tonal" class="text-body-2">
              {{ forgotMessage || GENERIC_FORGOT_SUCCESS }}
            </v-alert>
            <v-alert
              v-if="forgotError"
              type="error"
              variant="tonal"
              class="mt-4 text-body-2"
            >
              {{ forgotError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-2 pb-2">
            <v-spacer />
            <v-btn color="primary" class="font-weight-bold" @click="closeForgot">
              Entendido
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<style src="../../assets/login.css"></style>

<style scoped>
.forgot-link {
  background: none;
  border: 0;
  padding: 4px 2px;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.4;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 3px;
}

.forgot-link:hover {
  opacity: 0.9;
}
</style>
