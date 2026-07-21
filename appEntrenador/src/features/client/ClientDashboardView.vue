<script setup>
import { computed, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getProfile } from '../../shared/api/profileApi.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { resolveAvatarSrc } from '../../shared/utils/avatar.js';
import NotificationBadge from '../../components/notifications/NotificationBadge.vue';
import MacroSummaryCard from './components/MacroSummaryCard.vue';
import ClientDietView from './components/ClientDietView.vue';
import ConsistencyRing from './components/ConsistencyRing.vue';
import DailyHabitsChecklist from './components/DailyHabitsChecklist.vue';
import MembershipHomeCard from './components/MembershipHomeCard.vue';
import { useClientToday } from './composables/useClientToday.js';

const router = useRouter();
const userName = shallowRef('');
const userId = shallowRef(null);
const fotoUrl = shallowRef(null);
const heroReady = shallowRef(false);

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
  loadToday,
} = useClientToday();

const avatarSrc = computed(() => resolveAvatarSrc(fotoUrl.value));

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

const loadAvatar = async () => {
  if (!userId.value) return;
  try {
    const response = await getProfile(userId.value);
    fotoUrl.value = response.data.data?.foto_url ?? null;
  } catch (error) {
    console.error('Error cargando foto de perfil:', error);
    fotoUrl.value = null;
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

onMounted(async () => {
  const user = getSessionUser();

  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }

  userName.value = user.nombre || '';
  userId.value = user.id;
  loadAvatar();
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
          <!-- Estado de plan como meta del saludo (estilo apps fitness), no junto al avatar -->
          <MembershipHomeCard
            v-if="!loading && membership"
            :membership="membership"
            :forced-blocked="membershipBlocked"
          />
        </div>

        <div class="client-home__actions">
          <NotificationBadge />
          <router-link to="/client/profile" class="client-home__avatar" title="Mi Perfil">
            <img :src="avatarSrc" :alt="`Foto de ${userName}`">
          </router-link>
          <button
            type="button"
            class="header-logout-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <v-icon icon="mdi-logout-variant" size="18" />
          </button>
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

        <v-slide-y-transition>
          <section
            v-if="!loading && !loadError && heroReady"
            class="today-hero"
            :class="{ 'today-hero--locked': workoutLocked }"
            aria-label="Entrenamiento de hoy"
          >
            <template v-if="todayRoutine">
              <div
                class="today-hero__row"
                :class="{ 'today-hero__row--done': todayCompleted }"
              >
                <div class="today-hero__copy">
                  <p class="today-hero__eyebrow">
                    <template v-if="todayCompleted">Completado</template>
                    <template v-else-if="workoutLocked">Bloqueado</template>
                    <template v-else>Hoy</template>
                  </p>
                  <h2 class="today-hero__title">{{ todayRoutine.nombre_rutina }}</h2>
                  <p class="today-hero__meta">
                    <template v-if="todayCompleted">Ya entrenaste esta rutina hoy</template>
                    <template v-else-if="workoutLocked">
                      Membresía vencida — habla con tu entrenador
                    </template>
                    <template v-else>{{ heroMeta }}</template>
                  </p>
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
                <v-btn
                  v-else
                  color="primary"
                  class="today-hero__cta font-weight-bold"
                  rounded="lg"
                  elevation="6"
                  prepend-icon="mdi-play"
                  :to="{ name: 'WorkoutPlayer', params: { routineId: todayRoutine.id } }"
                >
                  Repetir
                </v-btn>
              </div>
            </template>

            <template v-else>
              <div class="today-hero__rest">
                <v-icon icon="mdi-weather-night" size="28" color="primary" />
                <div>
                  <h2 class="today-hero__title today-hero__title--rest">Día de descanso</h2>
                  <p class="today-hero__meta mb-0">Sin rutina hoy · recupera bien</p>
                </div>
              </div>
            </template>
          </section>
        </v-slide-y-transition>

        <div class="client-home__secondary">
          <div class="client-home__duo">
            <ConsistencyRing v-if="!loading" compact />

            <DailyHabitsChecklist
              v-if="!loading"
              compact
              :initial-habits="habits"
              :skip-fetch="true"
            />
          </div>

          <MacroSummaryCard
            v-if="!loading && userId && macros"
            compact
            :client-id="userId"
            :initial-target="macros"
            :skip-fetch="true"
          />

          <ClientDietView
            v-if="!loading"
            compact
          />
        </div>
      </div>
    </main>
  </AppShell>
</template>

<style src="../../assets/clientDashboard.css" scoped></style>
