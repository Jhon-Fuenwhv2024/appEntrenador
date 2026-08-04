<script setup>
import { computed, onMounted, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import SessionHeaderActions from '../../shared/layout/SessionHeaderActions.vue';
import ClientDietView from './components/ClientDietView.vue';
import ConsistencyRing from './components/ConsistencyRing.vue';
import DailyHabitsChecklist from './components/DailyHabitsChecklist.vue';
import MembershipHomeCard from './components/MembershipHomeCard.vue';
import HomeDayActions from './components/HomeDayActions.vue';
import WeeklyCheckinDialog from './components/WeeklyCheckinDialog.vue';
import ClientMembershipContactActions from './components/ClientMembershipContactActions.vue';
import { useClientToday } from './composables/useClientToday.js';
import { useClientHomeMode } from './composables/useClientHomeMode.js';

const router = useRouter();
const userName = shallowRef('');
const heroReady = shallowRef(false);
const checkinDialogOpen = shallowRef(false);
const habitsCelebrate = shallowRef(false);

const {
  loading,
  loadError,
  todayRoutine,
  todayCompleted,
  habits,
  macros,
  membership,
  membershipBlocked,
  workoutLocked,
  heroMeta,
  consistency,
  checkinDue,
  chatPreview,
  diet,
  weekInsight,
  currentStreak,
  loadToday,
} = useClientToday();

const {
  activityMode,
  heroEyebrow,
  heroTitle,
  heroMetaLine,
  showMembershipBanner,
  celebratePostWorkout,
  reengageTone,
} = useClientHomeMode({
  membership,
  membershipBlocked,
  todayRoutine,
  todayCompleted,
  currentStreak,
  heroMeta,
});

const membershipBannerTitle = computed(() => {
  const days = membership.value?.days_remaining == null
    ? null
    : Number(membership.value.days_remaining);
  if (membershipBlocked.value || (days != null && days < 0)) {
    return 'Membresía vencida';
  }
  if (days === 0) return 'Tu membresía vence hoy';
  if (days === 1) return 'Tu membresía vence mañana';
  if (days != null && Number.isFinite(days)) {
    return `Tu membresía vence en ${days} días`;
  }
  return 'Tu membresía necesita atención';
});

const showHeaderMembership = computed(() => (
  !loading.value && membership.value && !showMembershipBanner.value
));

const fechaCorta = computed(() => {
  const raw = new Date().toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
});

const firstName = computed(() => {
  const name = (userName.value || '').trim();
  return name.split(/\s+/)[0] || 'athlete';
});

watch(
  () => habits.value,
  (list) => {
    if (!Array.isArray(list) || !list.length) return;
    const allDone = list.every((h) => h.is_completed);
    if (allDone) {
      habitsCelebrate.value = true;
      setTimeout(() => {
        habitsCelebrate.value = false;
      }, 1200);
    }
  },
  { deep: true },
);

function openCheckin() {
  checkinDialogOpen.value = true;
}

function openChat() {
  router.push({ name: 'ClientMessages' });
}

async function onAdherenceChanged() {
  await loadToday({ silent: true });
}

onMounted(async () => {
  const user = getSessionUser();

  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }

  userName.value = user.nombre || '';
  await loadToday();
  heroReady.value = true;
});
</script>

<template>
  <AppShell role="client" active="dashboard">
    <main class="main-content client-home flex-grow-1 overflow-y-auto">
      <header class="client-home__header">
        <div class="client-home__intro">
          <p class="client-home__date">{{ fechaCorta }}</p>
          <h1 class="client-home__hello">
            Hola, <span class="text-cyan">{{ firstName }}</span>
          </h1>
          <MembershipHomeCard
            v-if="showHeaderMembership"
            :membership="membership"
            :forced-blocked="membershipBlocked"
          />
        </div>

        <div class="client-home__actions">
          <SessionHeaderActions role="client" />
        </div>
      </header>

      <div class="client-home__body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
          height="2"
        />

        <v-alert
          v-else-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="x-small" @click="loadToday">Reintentar</v-btn>
          </template>
        </v-alert>

        <div
          v-if="!loading && !loadError && showMembershipBanner"
          class="client-home__mem-banner"
          role="status"
        >
          <p class="client-home__mem-banner-title">{{ membershipBannerTitle }}</p>
          <p class="client-home__mem-banner-copy">
            Renueva o regulariza con tu entrenador para no perder el acceso.
          </p>
          <ClientMembershipContactActions
            note="Contactar entrenador"
            prefill-text="Hola, quiero renovar / regularizar mi membresía."
          />
        </div>

        <v-slide-y-transition>
          <section
            v-if="!loading && !loadError && heroReady"
            class="today-hero"
            :class="{
              'today-hero--locked': workoutLocked,
              'today-hero--celebrate': celebratePostWorkout,
              [`today-hero--${activityMode}`]: true,
            }"
            aria-label="Entrenamiento de hoy"
          >
            <template v-if="todayRoutine">
              <div
                class="today-hero__row"
                :class="{ 'today-hero__row--done': todayCompleted }"
              >
                <div class="today-hero__copy">
                  <p class="today-hero__eyebrow">{{ heroEyebrow }}</p>
                  <h2 class="today-hero__title">{{ heroTitle }}</h2>
                  <p class="today-hero__meta">{{ heroMetaLine }}</p>
                </div>
                <div
                  v-if="todayCompleted"
                  class="today-hero__done-badge"
                  aria-label="Entrenamiento completado"
                >
                  <v-icon icon="mdi-check-circle" size="20" />
                  Completado
                </div>
              </div>

              <div class="today-hero__actions">
                <v-btn
                  color="primary"
                  variant="outlined"
                  class="today-hero__cta today-hero__cta--secondary font-weight-bold"
                  rounded="lg"
                  prepend-icon="mdi-eye-outline"
                  :to="{ name: 'ClientRoutinePreview', params: { routineId: todayRoutine.id } }"
                >
                  Ver rutina
                </v-btn>
                <v-btn
                  v-if="workoutLocked"
                  color="error"
                  variant="tonal"
                  class="today-hero__cta font-weight-bold"
                  rounded="lg"
                  disabled
                  prepend-icon="mdi-lock"
                >
                  Bloqueado
                </v-btn>
                <v-btn
                  v-else-if="!todayCompleted"
                  color="primary"
                  class="today-hero__cta font-weight-bold"
                  rounded="lg"
                  elevation="6"
                  prepend-icon="mdi-play"
                  :to="{ name: 'WorkoutPlayer', params: { routineId: todayRoutine.id } }"
                >
                  Empezar
                </v-btn>
              </div>
            </template>

            <template v-else>
              <div class="today-hero__rest">
                <v-icon icon="mdi-weather-night" size="28" color="primary" />
                <div>
                  <h2 class="today-hero__title today-hero__title--rest">{{ heroTitle }}</h2>
                  <p class="today-hero__meta mb-0">{{ heroMetaLine }}</p>
                </div>
              </div>
            </template>
          </section>
        </v-slide-y-transition>

        <div class="client-home__secondary">
          <HomeDayActions
            v-if="!loading && !loadError"
            :checkin-due="checkinDue"
            :chat-preview="chatPreview"
            :week-insight="weekInsight"
            @open-checkin="openCheckin"
            @open-chat="openChat"
          />

          <div
            class="client-home__duo"
            :class="{ 'client-home__duo--celebrate': habitsCelebrate }"
          >
            <ConsistencyRing
              v-if="!loading"
              compact
              :reengage="reengageTone"
              :initial="consistency"
              :skip-fetch="Boolean(consistency)"
            />

            <DailyHabitsChecklist
              v-if="!loading"
              compact
              v-model:initial-habits="habits"
              :skip-fetch="true"
            />
          </div>

          <ClientDietView
            v-if="!loading"
            compact
            :membership-blocked="membershipBlocked"
            :diet-summary="diet"
            :macro-targets="macros"
            :highlight-next="celebratePostWorkout || activityMode === 'restDay'"
            @adherence-changed="onAdherenceChanged"
          />
        </div>
      </div>
    </main>

    <WeeklyCheckinDialog
      v-model="checkinDialogOpen"
      @submitted="loadToday"
    />
  </AppShell>
</template>

<style src="../../assets/clientDashboard.css" scoped></style>
