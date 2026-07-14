<script setup>
/**
 * Client "Mi Perfil" — loads/saves own alumnos_info via FormData.
 */
import { onMounted, reactive, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import {
  buildProfileFormData,
  getProfile,
  updateProfile,
} from '../../shared/api/profileApi.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import ProfileFormCard from '../../shared/components/ProfileFormCard.vue';

const router = useRouter();

const userId = shallowRef(null);
const profile = shallowRef(null);
const loading = shallowRef(true);
const saving = shallowRef(false);
const loadError = shallowRef('');

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

function notify(text, color = 'success') {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
}

async function loadProfile() {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getProfile(userId.value);
    profile.value = response.data.data ?? null;
  } catch (error) {
    console.error('Error cargando perfil:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu perfil');
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

async function onSave({ fields, fotoFile, done }) {
  try {
    saving.value = true;
    const formData = buildProfileFormData(fields, fotoFile);
    const response = await updateProfile(userId.value, formData);
    profile.value = response.data.data ?? profile.value;
    notify('Perfil actualizado');
    done?.(true);
  } catch (error) {
    console.error('Error guardando perfil:', error);
    notify(getApiErrorMessage(error, 'No se pudo guardar el perfil'), 'error');
    done?.(false);
  } finally {
    saving.value = false;
  }
}

function handleLogout() {
  clearSession();
  router.push('/');
}

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/dashboard');
    return;
  }
  userId.value = user.id;
  loadProfile();
});
</script>

<template>
  <AppShell role="client" active="profile">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Mi Perfil</h1>
          <p class="header-greeting text-medium-emphasis">
            Tus datos y foto para tu entrenador
          </p>
        </div>
        <div class="header-right">
          <button
            type="button"
            class="header-logout-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <v-icon icon="mdi-logout-variant" size="20" />
          </button>
        </div>
      </header>

      <div class="pa-4 pa-md-6" style="max-width: 560px; margin: 0 auto; width: 100%;">
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
        <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="small" @click="loadProfile">Reintentar</v-btn>
          </template>
        </v-alert>
        <ProfileFormCard
          v-else
          title="Mi perfil"
          :profile="profile"
          :saving="saving"
          @save="onSave"
        />
      </div>
    </main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3200">
      {{ snackbar.text }}
    </v-snackbar>
  </AppShell>
</template>
