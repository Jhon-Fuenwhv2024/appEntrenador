<script setup>
/**
 * Client "Mi Perfil" — identidad → membresía → avisos → seguridad.
 * Orden según patrones de account settings (status crítico antes que preferencias).
 */
import { onMounted, reactive, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { changeMyPassword } from '../../shared/api/accountApi.js';
import { getApiErrorMessage } from '../../shared/api/http.js';
import {
  buildProfileFormData,
  getProfile,
  updateProfile,
} from '../../shared/api/profileApi.js';
import { getSessionUser } from '../../shared/auth/session.js';
import { normalizeMembershipPeriod } from '../../shared/membership/period.js';
import AppShell from '../../shared/layout/AppShell.vue';
import SessionHeaderActions from '../../shared/layout/SessionHeaderActions.vue';
import ChangePasswordForm from '../../shared/components/ChangePasswordForm.vue';
import ProfileFormCard from '../../shared/components/ProfileFormCard.vue';
import PushOptInCard from '../../shared/components/PushOptInCard.vue';
import { getMyMembership } from './api/membershipApi.js';
import ClientProfileMembershipCard from './components/ClientProfileMembershipCard.vue';

const router = useRouter();

const userId = shallowRef(null);
const profile = shallowRef(null);
const membership = shallowRef(null);
const loading = shallowRef(true);
const saving = shallowRef(false);
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

async function loadMembershipSafe() {
  try {
    const response = await getMyMembership();
    return normalizeMembershipPeriod(response.data?.data ?? null);
  } catch (error) {
    console.warn('No se pudo cargar membresía en perfil:', error);
    return null;
  }
}

async function loadProfile() {
  try {
    loading.value = true;
    loadError.value = '';
    const [profileRes, mem] = await Promise.all([
      getProfile(userId.value),
      loadMembershipSafe(),
    ]);
    profile.value = profileRes.data.data ?? null;
    membership.value = mem;
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
    <main class="main-content flex-grow-1 overflow-y-auto client-profile">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Mi Perfil</h1>
          <p class="header-greeting text-medium-emphasis">
            Cuenta, plan y preferencias
          </p>
        </div>
        <div class="header-right">
          <SessionHeaderActions role="client" />
        </div>
      </header>

      <div class="client-profile__body">
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
            <v-btn variant="text" size="small" @click="loadProfile">Reintentar</v-btn>
          </template>
        </v-alert>

        <template v-else>
          <!-- 1. Identidad -->
          <section class="tf-profile-section" aria-labelledby="tf-sec-account">
            <h2 id="tf-sec-account" class="tf-profile-section__label">
              Cuenta
            </h2>
            <ProfileFormCard
              title="Mi perfil"
              :profile="profile"
              :saving="saving"
              @save="onSave"
            />
          </section>

          <!-- 2. Membresía (status crítico, antes que preferencias) -->
          <section class="tf-profile-section" aria-labelledby="tf-sec-plan">
            <h2 id="tf-sec-plan" class="tf-profile-section__label">
              Plan
            </h2>
            <ClientProfileMembershipCard :membership="membership" />
          </section>

          <!-- 3. Preferencias / notificaciones -->
          <section class="tf-profile-section" aria-labelledby="tf-sec-prefs">
            <h2 id="tf-sec-prefs" class="tf-profile-section__label">
              Preferencias
            </h2>
            <PushOptInCard show-workout-reminder @notify="notify" />
          </section>

          <!-- 4. Seguridad al final -->
          <section class="tf-profile-section" aria-labelledby="tf-sec-security">
            <h2 id="tf-sec-security" class="tf-profile-section__label">
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
.client-profile__body {
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
  .client-profile__body {
    padding: 0 1.5rem 2rem;
  }
}
</style>
