<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getMyAccount } from '../../shared/api/accountApi.js';
import { getApiErrorMessage, isPaymentRequiredError } from '../../shared/api/http.js';
import { useSessionAccount } from '../../shared/composables/useSessionAccount.js';
import AppShell from '../../shared/layout/AppShell.vue';
import SessionHeaderActions from '../../shared/layout/SessionHeaderActions.vue';
import SaasExpiredBanner from '../saas/components/SaasExpiredBanner.vue';
import { getTrainerDashboard } from './api/clientsApi.js';
import { generateInvitationLink } from './api/invitationsApi.js';
import InviteClientAction from './components/InviteClientAction.vue';
import TrainerMonthlyActivityChart from './components/TrainerMonthlyActivityChart.vue';
import TrainerPaymentsChart from './components/TrainerPaymentsChart.vue';
import TrainerStatsSummary from './components/TrainerStatsSummary.vue';

/** Tiempo que el link permanece visible antes de ocultarse solo. */
const INVITE_LINK_VISIBLE_MS = 60_000;
const PAYWALL_MESSAGE =
  'Has alcanzado el límite de 3 alumnos de tu plan gratuito. Contacta al soporte para actualizar a PRO y seguir creciendo.';

const router = useRouter();
const route = useRoute();

const {
  isSaasExpired,
  isProPlan,
  loadAccount: refreshSessionAccount,
} = useSessionAccount({ role: 'trainer' });

const userName = shallowRef('');
const invitationLink = shallowRef('');
const isGeneratingInvitation = shallowRef(false);
const paywallOpen = shallowRef(false);
const paywallMessage = shallowRef(PAYWALL_MESSAGE);
const dashboardStats = reactive({
  clientsCount: 0,
  routinesCount: 0,
  sessionsThisMonth: 0,
  growthPercent: 0,
  monthlyActivity: [],
  retention: {
    active: 0,
    inactive: 0,
    ratePercent: 0,
    windowDays: 14,
  },
  pendingTasks: {
    unreviewedCheckins: 0,
    dietsUnassigned: 0,
    total: 0,
  },
  weekProgress: {
    sessionsCompleted: 0,
    previousWeekSessions: 0,
    vsPreviousPercent: 0,
    weekStart: '',
    byDay: [],
  },
  payments: {
    active: 0,
    owing: 0,
    expired: 0,
    none: 0,
    expiringSoon: 0,
  },
});
let inviteLinkHideTimer = null;

const seatLimitHint = computed(() => (
  !isProPlan.value && Number(dashboardStats.clientsCount) > 3
));

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const currentDateLabel = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date().toLocaleDateString('es-ES', options);

  return date
    .split(', ')
    .map((part, index) => {
      if (index === 0) return part.charAt(0).toUpperCase() + part.slice(1);
      return part.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    })
    .join(', ');
});

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const loadAccountMeta = async () => {
  try {
    const response = await getMyAccount();
    const data = response.data?.data;
    if (data?.nombre) userName.value = data.nombre;
    await refreshSessionAccount({ force: true });
  } catch (error) {
    console.error('Error cargando cuenta del trainer:', error);
  }
};

const loadDashboard = async () => {
  try {
    const response = await getTrainerDashboard();
    const data = response.data?.data || {};

    dashboardStats.clientsCount = Number(data.clientsCount) || 0;
    dashboardStats.routinesCount = Number(data.routinesCount) || 0;
    dashboardStats.sessionsThisMonth = Number(data.sessionsThisMonth) || 0;
    dashboardStats.growthPercent = Number(data.growthPercent) || 0;
    dashboardStats.monthlyActivity = Array.isArray(data.monthlyActivity)
      ? data.monthlyActivity
      : [];

    const retention = data.retention || {};
    dashboardStats.retention = {
      active: Number(retention.active) || 0,
      inactive: Number(retention.inactive) || 0,
      ratePercent: Number(retention.ratePercent) || 0,
      windowDays: Number(retention.windowDays) || 14,
    };

    const pending = data.pendingTasks || {};
    const unreviewed = Number(pending.unreviewedCheckins) || 0;
    const diets = Number(pending.dietsUnassigned) || 0;
    dashboardStats.pendingTasks = {
      unreviewedCheckins: unreviewed,
      dietsUnassigned: diets,
      total: Number(pending.total) || unreviewed + diets,
    };

    const week = data.weekProgress || {};
    dashboardStats.weekProgress = {
      sessionsCompleted: Number(week.sessionsCompleted) || 0,
      previousWeekSessions: Number(week.previousWeekSessions) || 0,
      vsPreviousPercent: Number(week.vsPreviousPercent) || 0,
      weekStart: week.weekStart || '',
      byDay: Array.isArray(week.byDay) ? week.byDay : [],
    };

    const pay = data.payments || {};
    dashboardStats.payments = {
      active: Number(pay.active) || 0,
      owing: Number(pay.owing) || 0,
      expired: Number(pay.expired) || 0,
      none: Number(pay.none) || 0,
      expiringSoon: Number(pay.expiringSoon) || 0,
    };
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    showNotification(getApiErrorMessage(error, 'Error al cargar métricas'), 'error');
  }
};

const buildInvitationLink = (payload = {}) => {
  if (payload.token) {
    return `${window.location.origin}/registro?token=${payload.token}`;
  }
  return payload.link_invitacion || '';
};

const clearInviteLinkHideTimer = () => {
  if (inviteLinkHideTimer) {
    clearTimeout(inviteLinkHideTimer);
    inviteLinkHideTimer = null;
  }
};

const scheduleInviteLinkHide = () => {
  clearInviteLinkHideTimer();
  inviteLinkHideTimer = setTimeout(() => {
    invitationLink.value = '';
    inviteLinkHideTimer = null;
  }, INVITE_LINK_VISIBLE_MS);
};

const copyInvitationLink = async () => {
  if (!invitationLink.value) return false;

  try {
    await navigator.clipboard.writeText(invitationLink.value);
    return true;
  } catch (error) {
    console.error('No se pudo copiar el link:', error);
    return false;
  }
};

const handleGenerateInvite = async () => {
  try {
    isGeneratingInvitation.value = true;
    const response = await generateInvitationLink();
    const payload = response.data?.data || response.data || {};
    invitationLink.value = buildInvitationLink(payload);
    scheduleInviteLinkHide();

    const copied = await copyInvitationLink();
    showNotification(
      copied
        ? 'Link generado y copiado al portapapeles'
        : 'Link generado. Usa el botón Copiar si hace falta',
      copied ? 'success' : 'info',
    );
  } catch (error) {
    console.error('Error al generar invitación:', error);
    if (isPaymentRequiredError(error)) {
      paywallMessage.value = error?.response?.data?.message || PAYWALL_MESSAGE;
      paywallOpen.value = true;
      return;
    }
    showNotification(getApiErrorMessage(error, 'Error al generar'), 'error');
  } finally {
    isGeneratingInvitation.value = false;
  }
};

const goToClients = () => {
  router.push('/trainer/clients');
};

const scrollToInviteIfNeeded = async () => {
  if (route.hash !== '#invite') return;
  await nextTick();
  document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');
  const storedToken = localStorage.getItem('authToken');

  if (!storedRole || !storedToken) {
    router.push('/');
    return;
  }

  if (storedRole !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  userName.value = storedName || '';
  loadAccountMeta();
  loadDashboard().then(scrollToInviteIfNeeded);
});

onUnmounted(() => {
  clearInviteLinkHideTimer();
});
</script>

<template>
  <AppShell role="trainer" active="dashboard">
    <main class="main-content flex-grow-1 trainer-dash-main">
      <header class="dashboard-header">
        <div class="header-left">
          <div class="header-date">
            <v-icon icon="mdi-calendar-blank-outline" size="14"></v-icon>
            {{ currentDateLabel }}
          </div>
          <h1 class="header-title">Inicio</h1>
          <p class="header-greeting">
            Bienvenido de vuelta, <span class="text-cyan">{{ userName }}</span>
          </p>
          <SaasExpiredBanner
            :expired="isSaasExpired"
            :seat-limit-hint="seatLimitHint"
          />
        </div>

        <div class="header-right">
          <SessionHeaderActions role="trainer" />
        </div>
      </header>

      <div class="trainer-dash-body">
        <TrainerStatsSummary
          :clients-count="dashboardStats.clientsCount"
          :sessions-this-month="dashboardStats.sessionsThisMonth"
          :retention="dashboardStats.retention"
          :pending-tasks="dashboardStats.pendingTasks"
          :week-progress="dashboardStats.weekProgress"
          @open-clients="goToClients"
        />

        <div class="hub-grid">
          <div class="charts-duo">
            <TrainerMonthlyActivityChart :months="dashboardStats.monthlyActivity" />
            <TrainerPaymentsChart :payments="dashboardStats.payments" />
          </div>

          <InviteClientAction
            :loading="isGeneratingInvitation"
            :invitation-link="invitationLink"
            :clients-count="dashboardStats.clientsCount"
            @generate-invite="handleGenerateInvite"
            @copy-invite="copyInvitationLink"
            @go-to-clients="goToClients"
          />
        </div>
      </div>
    </main>
  </AppShell>

  <v-dialog v-model="paywallOpen" max-width="440">
    <v-card color="surface">
      <v-card-title class="text-h6 d-flex align-center ga-2">
        <v-icon icon="mdi-lock-outline" color="warning" />
        Límite del plan
      </v-card-title>
      <v-card-text>
        {{ paywallMessage }}
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn color="primary" @click="paywallOpen = false">
          Entendido
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
    {{ snackbar.text }}
    <template #actions>
      <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.trainer-dash-main {
  display: flex;
  flex-direction: column;
}

.trainer-dash-main :deep(.dashboard-header) {
  margin-bottom: 14px;
}

.trainer-dash-main :deep(.header-title) {
  font-size: 24px;
  margin-bottom: 2px;
}

.trainer-dash-main :deep(.header-greeting) {
  font-size: 13px;
}

.trainer-dash-main :deep(.quick-actions) {
  padding: 14px;
}

.trainer-dash-main :deep(.quick-actions-header) {
  margin-bottom: 12px;
}

.trainer-dash-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding-bottom: 12px;
}

.hub-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  min-width: 0;
}

.hub-grid > * {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.charts-duo {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
}

.charts-duo > * {
  min-width: 0;
  height: 100%;
}

@media (min-width: 700px) {
  .charts-duo {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (min-width: 961px) {
  .hub-grid {
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 12px;
  }
}

@media (max-width: 960px) {
  .trainer-dash-body {
    gap: 10px;
  }
}
</style>
