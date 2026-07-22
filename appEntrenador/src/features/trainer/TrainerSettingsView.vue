<script setup>
/**
 * Trainer settings — account profile + password (Feature 024).
 */
import { onMounted, reactive, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import {
  buildAccountFormData,
  changeMyPassword,
  getMyAccount,
  updateMyAccount,
} from '../../shared/api/accountApi.js';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser, setSession } from '../../shared/auth/session.js';
import { useSessionAccount } from '../../shared/composables/useSessionAccount.js';
import AppShell from '../../shared/layout/AppShell.vue';
import SessionHeaderActions from '../../shared/layout/SessionHeaderActions.vue';
import ChangePasswordForm from '../../shared/components/ChangePasswordForm.vue';
import TrainerAccountCard from '../../shared/components/TrainerAccountCard.vue';

const router = useRouter();
const { loadAccount: refreshSessionHeader } = useSessionAccount({ role: 'trainer' });

const account = shallowRef(null);
const loading = shallowRef(true);
const savingProfile = shallowRef(false);
const savingPassword = shallowRef(false);
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

async function loadAccount() {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getMyAccount();
    account.value = response.data.data ?? null;
  } catch (error) {
    console.error('Error cargando cuenta:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu cuenta');
    account.value = null;
  } finally {
    loading.value = false;
  }
}

async function onSaveProfile({ fields, fotoFile, done }) {
  try {
    savingProfile.value = true;
    const formData = buildAccountFormData(fields, fotoFile);
    const response = await updateMyAccount(formData);
    account.value = response.data.data ?? account.value;
    if (response.data.token) {
      setSession({
        token: response.data.token,
        user: {
          id: account.value.id,
          rol: account.value.rol,
          nombre: account.value.nombre,
        },
      });
    }
    notify('Perfil actualizado');
    await refreshSessionHeader({ force: true });
    done?.(true);
  } catch (error) {
    console.error('Error guardando perfil de cuenta:', error);
    notify(getApiErrorMessage(error, 'No se pudo guardar el perfil'), 'error');
    done?.(false);
  } finally {
    savingProfile.value = false;
  }
}

async function onChangePassword({ current_password, new_password, done }) {
  try {
    savingPassword.value = true;
    await changeMyPassword({ current_password, new_password });
    notify('Contraseña actualizada');
    done?.(true);
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    notify(getApiErrorMessage(error, 'No se pudo cambiar la contraseña'), 'error');
    done?.(false);
  } finally {
    savingPassword.value = false;
  }
}

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
    return;
  }
  loadAccount();
});
</script>

<template>
  <AppShell role="trainer" active="settings">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Ajustes</h1>
          <p class="header-greeting text-medium-emphasis">
            Tu perfil de cuenta
          </p>
        </div>
        <div class="header-right">
          <SessionHeaderActions role="trainer" />
        </div>
      </header>

      <div class="pa-4 pa-md-6 settings-wrap">
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
        <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="small" @click="loadAccount">Reintentar</v-btn>
          </template>
        </v-alert>

        <template v-else>
          <TrainerAccountCard
            class="mb-4"
            :account="account"
            :saving="savingProfile"
            @save="onSaveProfile"
          />
          <ChangePasswordForm
            :saving="savingPassword"
            @submit="onChangePassword"
          />
        </template>
      </div>
    </main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3200">
      {{ snackbar.text }}
    </v-snackbar>
  </AppShell>
</template>

<style scoped>
.settings-wrap {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}
</style>
