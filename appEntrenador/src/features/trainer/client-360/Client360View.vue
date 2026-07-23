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
import { getSessionUser } from '../../../shared/auth/session.js';
import AppShell from '../../../shared/layout/AppShell.vue';
import SessionHeaderActions from '../../../shared/layout/SessionHeaderActions.vue';
import ProfileFormCard from '../../../shared/components/ProfileFormCard.vue';
import ChatThread from '../../messaging/components/ChatThread.vue';
import { getClientOverview } from '../api/clientsApi.js';
import { getClientRoutines } from '../api/routinesApi.js';
import { getClientWorkoutSessions } from '../api/workoutSessionsApi.js';
import BodyCompositionPanel from '../components/BodyCompositionPanel.vue';
import CheckinsHistoryPanel from '../components/CheckinsHistoryPanel.vue';
import DailyHabitsPanel from '../components/DailyHabitsPanel.vue';
import ConsistencyPanel from '../components/ConsistencyPanel.vue';
import MembershipPanel from '../components/MembershipPanel.vue';
import DietPlanPanel from '../components/DietPlanPanel.vue';
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
const clientRoutines = shallowRef([]);
const sessionsHasMore = shallowRef(false);
const sessionsLoadingMore = shallowRef(false);
const SESSIONS_PAGE_SIZE = 12;
const loading = shallowRef(true);
const savingProfile = shallowRef(false);
/** Remonta el panel 031 cuando un plan activo sincroniza macros. */
const nutritionPanelKey = shallowRef(0);

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
const seatEditable = computed(() => overview.value?.seat_editable !== false);

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const onChildNotify = ({ text, color }) => {
  showNotification(text, color || 'success');
};

const onDietTargetsSynced = () => {
  nutritionPanelKey.value += 1;
};

const onMembershipUpdated = (data) => {
  if (!overview.value) return;
  overview.value = {
    ...overview.value,
    membership: data
      ? {
        status: data.status,
        period_start: data.period_start ?? null,
        period_end: data.period_end ?? null,
        days_remaining: data.days_remaining ?? null,
        block_on_unpaid: Boolean(data.block_on_unpaid),
      }
      : null,
  };
};

const onConsistencyUpdated = (data) => {
  if (!overview.value || !data) return;
  overview.value = {
    ...overview.value,
    consistencyScore: {
      value: data.score,
      current_streak: data.current_streak,
      best_streak: data.best_streak,
      week_goal: data.week_goal,
      workouts_this_week: data.workouts_this_week,
    },
  };
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

const loadSessions = async ({ append = false } = {}) => {
  try {
    if (append) {
      sessionsLoadingMore.value = true;
    }
    const offset = append ? workoutSessions.value.length : 0;
    const sessionsRes = await getClientWorkoutSessions(clientId.value, {
      limit: SESSIONS_PAGE_SIZE,
      offset,
    });
    const payload = sessionsRes.data?.data;
    const list = Array.isArray(payload)
      ? payload
      : (payload?.sessions ?? []);
    const hasMore = Array.isArray(payload)
      ? false
      : Boolean(payload?.hasMore);

    if (append) {
      const seen = new Set(workoutSessions.value.map((s) => s.id));
      const next = list.filter((s) => !seen.has(s.id));
      workoutSessions.value = [...workoutSessions.value, ...next];
    } else {
      workoutSessions.value = list;
    }
    sessionsHasMore.value = hasMore;
  } catch (error) {
    console.error('Error cargando historial de entrenamientos:', error);
    if (!append) {
      workoutSessions.value = [];
      sessionsHasMore.value = false;
    }
    showNotification(
      getApiErrorMessage(error, 'No se pudo cargar el historial de entrenamientos'),
      'warning',
    );
  } finally {
    sessionsLoadingMore.value = false;
  }
};

const loadMoreSessions = () => {
  if (sessionsLoadingMore.value || !sessionsHasMore.value) return;
  return loadSessions({ append: true });
};

/** Feature 066 — rutinas del alumno para fila «Pendiente» en Actividad reciente. */
const loadRoutines = async () => {
  try {
    const routinesRes = await getClientRoutines(clientId.value);
    clientRoutines.value = routinesRes.data?.data ?? [];
  } catch (error) {
    console.error('Error cargando rutinas del alumno (Resumen 360):', error);
    clientRoutines.value = [];
    showNotification(
      getApiErrorMessage(error, 'No se pudo cargar la rutina programada de hoy'),
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

  await Promise.all([loadSessions(), loadRoutines()]);
};

const onSaveProfile = async ({ fields, fotoFile, done }) => {
  if (!seatEditable.value) {
    showNotification(
      'Solo lectura: este alumno está fuera de tu cupo FREE. Renueva PRO para editarlo.',
      'warning',
    );
    done?.(false);
    return;
  }
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

watch(clientId, () => {
  overview.value = null;
  clientProfile.value = null;
  workoutSessions.value = [];
  clientRoutines.value = [];
  sessionsHasMore.value = false;
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
    <main class="main-content c360-main flex-grow-1 overflow-y-auto">
      <div class="c360-body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-2"
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
            :seat-editable="seatEditable"
            @back="router.push('/trainer/clients')"
          >
            <template #actions>
              <SessionHeaderActions role="trainer" />
            </template>
          </Client360Header>

          <p
            v-if="!seatEditable"
            class="c360-seat-lock"
            role="status"
          >
            <span class="c360-seat-lock__dot" aria-hidden="true" />
            <span>
              Solo lectura · fuera de tus 3 alumnos editables del plan FREE. Chat disponible; renueva PRO para editar.
            </span>
          </p>

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

          <div
            class="c360-tab-body"
            :class="{ 'c360-tab-body--readonly': !seatEditable && activeTab !== 'chat' }"
          >
          <div
            v-if="activeTab === 'resumen'"
            class="c360-stack"
          >
            <div class="c360-status-row">
              <MembershipPanel
                :client-id="clientId"
                @notify="onChildNotify"
                @updated="onMembershipUpdated"
              />
              <ConsistencyPanel
                :client-id="clientId"
                @notify="onChildNotify"
                @updated="onConsistencyUpdated"
              />
            </div>
            <Client360Overview
              :overview="overview"
              :sessions="workoutSessions"
              :routines="clientRoutines"
              :sessions-has-more="sessionsHasMore"
              :sessions-loading-more="sessionsLoadingMore"
              :client-name="client?.nombre || ''"
              @go-tab="setTab"
              @load-more-sessions="loadMoreSessions"
            />
          </div>

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
              :key="nutritionPanelKey"
              :client-id="clientId"
              @notify="onChildNotify"
            />
            <DietPlanPanel
              :client-id="clientId"
              @notify="onChildNotify"
              @targets-synced="onDietTargetsSynced"
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
          </div>
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
.c360-main.main-content {
  padding-top: 10px !important;
  padding-bottom: 1rem !important;
}

.c360-body {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

@media (min-width: 960px) {
  .c360-main.main-content {
    padding-top: 12px !important;
  }

  .c360-body {
    padding: 0 1.15rem 1.25rem;
  }
}

.c360-tabs-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin: 0 -0.15rem;
  padding: 0 0.15rem;
}

.c360-seat-lock {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.35;
  color: #ff8a80;
}

.c360-seat-lock__dot {
  width: 6px;
  height: 6px;
  margin-top: 0.3rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: #ff5c5c;
  box-shadow: 0 0 8px rgba(255, 92, 92, 0.45);
}

.c360-tab-body--readonly {
  position: relative;
  opacity: 0.72;
  pointer-events: none;
  user-select: none;
}

.c360-tab-body--readonly::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 12px;
  background: transparent;
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
  gap: 0.65rem;
}

.c360-status-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  align-items: stretch;
}

@media (min-width: 600px) {
  .c360-status-row {
    grid-template-columns: 1fr 1fr;
  }
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
