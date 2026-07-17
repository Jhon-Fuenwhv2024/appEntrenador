<script setup>
/**
 * Client 360 orchestrator — route `/trainer/clients/:clientId`.
 * Sections via `?tab=` deep-link. Reuses existing panels without CRUD loss.
 */
import { computed, defineAsyncComponent, onMounted, reactive, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  buildProfileFormData,
  getProfile,
  updateProfile,
} from '../../../shared/api/profileApi.js';
import { clearSession, getSessionUser } from '../../../shared/auth/session.js';
import AppShell from '../../../shared/layout/AppShell.vue';
import ProfileFormCard from '../../../shared/components/ProfileFormCard.vue';
import ChatThread from '../../messaging/components/ChatThread.vue';
import { getClientOverview } from '../api/clientsApi.js';
import { getClientWorkoutSessions } from '../api/workoutSessionsApi.js';
import BodyCompositionPanel from '../components/BodyCompositionPanel.vue';
import CheckinsHistoryPanel from '../components/CheckinsHistoryPanel.vue';
import DailyHabitsPanel from '../components/DailyHabitsPanel.vue';
import NutritionTargetsPanel from '../components/NutritionTargetsPanel.vue';
import Client360Header from './Client360Header.vue';
import Client360Overview from './Client360Overview.vue';
import Client360Programming from './Client360Programming.vue';
import { CLIENT_360_TABS, normalizeClient360Tab } from './client360Tabs.js';

const ProgressChartsPanel = defineAsyncComponent(() => (
  import('../../../shared/components/ProgressChartsPanel.vue')
));

const route = useRoute();
const router = useRouter();

const clientId = computed(() => Number(route.params.clientId));

const overview = shallowRef(null);
const clientProfile = shallowRef(null);
const workoutSessions = shallowRef([]);
const loading = shallowRef(true);
const savingProfile = shallowRef(false);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const activeTab = computed({
  get: () => normalizeClient360Tab(route.query.tab),
  set: (value) => {
    const tab = normalizeClient360Tab(value);
    const nextQuery = { ...route.query };
    if (tab === 'resumen') {
      delete nextQuery.tab;
    } else {
      nextQuery.tab = tab;
    }
    router.replace({ query: nextQuery });
  },
});

const client = computed(() => overview.value?.client || null);
const membership = computed(() => overview.value?.membership ?? null);
const consistencyScore = computed(() => overview.value?.consistencyScore ?? null);
const routinesCount = computed(() => overview.value?.counts?.routines ?? 0);
const sessionsCount = computed(() => overview.value?.counts?.sessions ?? 0);

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const onChildNotify = ({ text, color }) => {
  showNotification(text, color || 'success');
};

const setTab = (tab) => {
  activeTab.value = tab;
};

const loadOverview = async () => {
  const res = await getClientOverview(clientId.value);
  overview.value = res.data.data ?? null;
  if (overview.value?.profile) {
    clientProfile.value = overview.value.profile;
  }
};

const loadSessions = async () => {
  try {
    const sessionsRes = await getClientWorkoutSessions(clientId.value);
    workoutSessions.value = sessionsRes.data.data ?? [];
  } catch (error) {
    console.error('Error cargando historial de entrenamientos:', error);
    workoutSessions.value = [];
    showNotification(
      getApiErrorMessage(error, 'No se pudo cargar el historial de entrenamientos'),
      'warning',
    );
  }
};

const loadProfileFallback = async () => {
  try {
    const profileRes = await getProfile(clientId.value);
    clientProfile.value = profileRes.data.data ?? clientProfile.value;
  } catch (error) {
    console.error('Error cargando perfil del alumno:', error);
    if (!clientProfile.value) {
      clientProfile.value = {
        user_id: clientId.value,
        nombre: client.value?.nombre || '',
        username: client.value?.username || '',
        telefono: '',
        fecha_nacimiento: '',
        sexo: '',
        lesiones: '',
        objetivo: '',
        foto_url: null,
      };
    }
    showNotification(
      getApiErrorMessage(error, 'No se pudo cargar el perfil del alumno'),
      'warning',
    );
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    await loadOverview();
  } catch (error) {
    console.error('Error cargando overview 360:', error);
    overview.value = null;
    showNotification(getApiErrorMessage(error, 'No se pudo cargar el alumno'), 'error');
  } finally {
    loading.value = false;
  }

  if (!clientProfile.value) {
    await loadProfileFallback();
  }

  await loadSessions();
};

const onSaveProfile = async ({ fields, fotoFile, done }) => {
  try {
    savingProfile.value = true;
    const formData = buildProfileFormData(fields, fotoFile);
    const response = await updateProfile(clientId.value, formData);
    clientProfile.value = response.data.data ?? clientProfile.value;
    if (overview.value) {
      overview.value = {
        ...overview.value,
        profile: clientProfile.value,
      };
    }
    showNotification('Perfil del alumno actualizado');
    done?.(true);
  } catch (error) {
    console.error('Error guardando perfil del alumno:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar el perfil'), 'error');
    done?.(false);
  } finally {
    savingProfile.value = false;
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

watch(clientId, () => {
  overview.value = null;
  clientProfile.value = null;
  workoutSessions.value = [];
  loadData();
});

onMounted(() => {
  const user = getSessionUser();

  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  loadData();
});
</script>

<template>
  <AppShell role="trainer" active="clients">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <div class="c360-body">
        <div class="c360-topbar">
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

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
          height="2"
        />

        <template v-else>
          <Client360Header
            :client="client"
            :profile="clientProfile"
            :last-session="overview?.lastSession"
            :membership="membership"
            :consistency-score="consistencyScore"
            :routines-count="routinesCount"
            :sessions-count="sessionsCount"
            @back="router.push('/trainer/clients')"
          />

          <div class="c360-tabs-wrap">
            <v-tabs
              v-model="activeTab"
              color="primary"
              density="compact"
              class="c360-tabs"
              show-arrows
            >
              <v-tab
                v-for="tab in CLIENT_360_TABS"
                :key="tab.value"
                :value="tab.value"
              >
                <v-icon :icon="tab.icon" start size="18" />
                {{ tab.label }}
              </v-tab>
            </v-tabs>
          </div>

          <Client360Overview
            v-if="activeTab === 'resumen'"
            :overview="overview"
            :sessions="workoutSessions"
            :client-name="client?.nombre || ''"
            @go-tab="setTab"
          />

          <Client360Programming
            v-else-if="activeTab === 'programacion'"
            :client-id="clientId"
            @notify="onChildNotify"
          />

          <div
            v-else-if="activeTab === 'nutricion'"
            class="c360-stack"
          >
            <NutritionTargetsPanel
              :client-id="clientId"
              @notify="onChildNotify"
            />
            <DailyHabitsPanel
              :client-id="clientId"
              @notify="onChildNotify"
            />
          </div>

          <div
            v-else-if="activeTab === 'medidas'"
            class="c360-stack"
          >
            <ProfileFormCard
              title="Perfil"
              :profile="clientProfile"
              :saving="savingProfile"
              @save="onSaveProfile"
            />
            <BodyCompositionPanel
              :client-id="clientId"
              @notify="onChildNotify"
            />
          </div>

          <section
            v-else-if="activeTab === 'checkins'"
            class="c360-panel"
          >
            <CheckinsHistoryPanel
              :client-id="clientId"
              @notify="onChildNotify"
            />
          </section>

          <ProgressChartsPanel
            v-else-if="activeTab === 'graficas'"
            :client-id="clientId"
          />

          <section
            v-else-if="activeTab === 'chat'"
            class="c360-panel c360-chat"
          >
            <ChatThread
              :partner-id="clientId"
              :partner-name="client?.nombre || ''"
            />
          </section>
        </template>
      </div>
    </main>
  </AppShell>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.c360-body {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

@media (min-width: 960px) {
  .c360-body {
    padding: 0.35rem 1.25rem 1.5rem;
  }
}

.c360-topbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -0.25rem;
}

.c360-tabs-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin: 0 -0.15rem;
  padding: 0 0.15rem;
}

.c360-tabs {
  min-width: max-content;
}

.c360-tabs :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.c360-stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.c360-panel {
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.c360-chat {
  min-height: min(70vh, 640px);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.c360-chat :deep(.chat-thread) {
  flex: 1;
  min-height: 420px;
}

.c360-stack :deep(.ntp),
.c360-stack :deep(.dhp),
.c360-stack :deep(.bcp) {
  margin-top: 0;
}
</style>
