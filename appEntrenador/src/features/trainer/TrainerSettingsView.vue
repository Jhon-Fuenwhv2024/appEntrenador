<script setup>
/**
 * Trainer settings — cuenta → plan SaaS → preferencias → seguridad.
 * Mismo patrón IA que ClientProfileView (Feature 024 / 065 / 051).
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
import PushOptInCard from '../../shared/components/PushOptInCard.vue';
import TextScaleCard from '../../shared/components/TextScaleCard.vue';
import TrainerAccountCard from '../../shared/components/TrainerAccountCard.vue';
import TrainerSaasPlanCard from '../saas/components/TrainerSaasPlanCard.vue';

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
    <main class="main-content flex-grow-1 overflow-y-auto trainer-settings">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Ajustes</h1>
          <p class="header-greeting text-medium-emphasis">
            Cuenta, plan y preferencias
          </p>
        </div>
        <div class="header-right">
          <SessionHeaderActions role="trainer" />
        </div>
      </header>

      <div class="trainer-settings__body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
          height="2"
        />

        <v-alert
          v-else-if="loadError"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="small" @click="loadAccount">Reintentar</v-btn>
          </template>
        </v-alert>

        <template v-else>
          <section class="tf-profile-section" aria-labelledby="tf-tr-account">
            <h2 id="tf-tr-account" class="tf-profile-section__label">
              Cuenta
            </h2>
            <TrainerAccountCard
              :account="account"
              :saving="savingProfile"
              @save="onSaveProfile"
            />
          </section>

          <section class="tf-profile-section" aria-labelledby="tf-tr-plan">
            <h2 id="tf-tr-plan" class="tf-profile-section__label">
              Plan
            </h2>
            <TrainerSaasPlanCard :account="account" />
          </section>

          <section class="tf-profile-section" aria-labelledby="tf-tr-prefs">
            <h2 id="tf-tr-prefs" class="tf-profile-section__label">
              Preferencias
            </h2>
            <TextScaleCard />
            <PushOptInCard @notify="notify" />
          </section>

          <section class="tf-profile-section" aria-labelledby="tf-tr-security">
            <h2 id="tf-tr-security" class="tf-profile-section__label">
              Seguridad
            </h2>
            <ChangePasswordForm
              :saving="savingPassword"
              @submit="onChangePassword"
            />
          </section>
        </template>
      </div>
    </main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3200">
      {{ snackbar.text }}
    </v-snackbar>
  </AppShell>
</template>

<style scoped>
.trainer-settings__body {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 1rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.tf-profile-section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.tf-profile-section__label {
  margin: 0;
  padding: 0 0.15rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

@media (min-width: 960px) {
  .trainer-settings__body {
    padding: 0 1.5rem 2rem;
  }
}
</style>
