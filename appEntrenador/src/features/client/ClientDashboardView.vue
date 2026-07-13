<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { APP_NAME } from '../../config/app.js';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import { getMyRoutines } from './api/routinesApi.js';

const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const router = useRouter();
const userName = shallowRef('');
const loading = shallowRef(true);
const loadError = shallowRef('');
const routines = ref([]);

const fechaActual = computed(() => {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fecha = new Date().toLocaleDateString('es-ES', opciones);
  return fecha
    .split(', ')
    .map((part, index) => {
      if (index === 0) return part.charAt(0).toUpperCase() + part.slice(1);
      return part.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    })
    .join(', ');
});

const todayLabel = computed(() => {
  const raw = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
  const normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return DAY_ORDER.find((d) => d.toLowerCase() === normalized.toLowerCase()) || normalized;
});

const tienePlanActivo = computed(() => routines.value.length > 0);

const sesionHoy = computed(() => {
  const match = routines.value.find((r) => r.dia_semana === todayLabel.value);
  return match || routines.value[0] || null;
});

const routinesByDay = computed(() => {
  const map = new Map(DAY_ORDER.map((day) => [day, []]));
  for (const routine of routines.value) {
    const list = map.get(routine.dia_semana) || [];
    list.push(routine);
    map.set(routine.dia_semana, list);
  }
  return DAY_ORDER
    .map((day) => ({ day, items: map.get(day) || [] }))
    .filter((entry) => entry.items.length > 0);
});

const obtenerIniciales = (nombre) => {
  if (!nombre) return '??';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
};

const loadRoutines = async () => {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getMyRoutines();
    routines.value = response.data.data ?? [];
  } catch (error) {
    console.error('Error cargando rutinas del cliente:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar tus rutinas');
    routines.value = [];
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

onMounted(() => {
  const user = getSessionUser();

  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }

  userName.value = user.nombre || '';
  loadRoutines();
});
</script>

<template>
  <div class="dashboard-bg">
    <nav class="sidebar-pill">
      <div class="logo-wrap">
        <AppLogo size="md" />
      </div>

      <div class="nav-item active">
        <v-icon icon="mdi-view-dashboard-outline" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-calendar-check" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-food-apple" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-cog-outline" size="24"></v-icon>
      </div>

      <div class="nav-item nav-bottom mb-0" title="Cerrar Sesión" @click="handleLogout">
        <v-icon icon="mdi-logout-variant" size="24"></v-icon>
      </div>
    </nav>

    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <div class="header-date">
            <v-icon icon="mdi-calendar-blank-outline" size="14"></v-icon>
            {{ fechaActual }}
          </div>
          <h1 class="header-title">{{ APP_NAME }}</h1>
          <p class="header-greeting">
            Bienvenido, <span class="text-cyan">{{ userName }}</span>
          </p>
        </div>

        <div class="header-right">
          <div class="profile-pill">
            <div class="profile-avatar">{{ obtenerIniciales(userName) }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">Cliente</div>
            </div>
          </div>
        </div>
      </header>

      <div class="pa-8 pt-0">
        <v-progress-linear v-if="loading" indeterminate color="#00E5FF" class="mb-6" />

        <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-6">
          {{ loadError }}
        </v-alert>

        <div v-else-if="!tienePlanActivo" class="client-empty-card">
          <v-icon icon="mdi-rocket-launch-outline" size="28" color="#8B929E" class="client-empty-icon"></v-icon>
          <h2 class="client-empty-title">Aún no tienes rutinas asignadas</h2>
          <p class="client-empty-desc">
            Cuando tu entrenador te asigne un plan, lo verás aquí automáticamente.
          </p>
        </div>

        <template v-else>
          <v-row>
            <v-col cols="12" md="8">
              <div v-if="sesionHoy" class="functional-card workout-card">
                <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
                  <div>
                    <h3 class="card-section-title">
                      {{ sesionHoy.dia_semana === todayLabel ? 'Entrenamiento de Hoy' : 'Próxima sesión' }}
                    </h3>
                    <div class="card-section-subtitle">
                      {{ sesionHoy.dia_semana }} · {{ sesionHoy.nombre_rutina }}
                    </div>
                  </div>
                  <v-btn
                    color="#00E5FF"
                    class="text-black font-weight-bold"
                    size="large"
                    prepend-icon="mdi-play"
                    :to="{ name: 'WorkoutPlayer', params: { routineId: sesionHoy.id } }"
                  >
                    Comenzar
                  </v-btn>
                </div>

                <div class="exercise-list">
                  <div
                    v-for="(ejercicio, i) in sesionHoy.ejercicios"
                    :key="ejercicio.id || i"
                    class="exercise-item"
                  >
                    <div class="exercise-num">{{ i + 1 }}</div>
                    <div class="exercise-details">
                      <div class="exercise-name">{{ ejercicio.nombre }}</div>
                      <div class="exercise-meta">
                        {{ ejercicio.series }} Series · {{ ejercicio.repeticiones }} Reps · {{ ejercicio.peso }} kg
                      </div>
                      <div v-if="ejercicio.indicaciones" class="text-caption mt-1">
                        {{ ejercicio.indicaciones }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="functional-card diet-card">
                <h3 class="card-section-title mb-4">Plan semanal</h3>
                <div
                  v-for="entry in routinesByDay"
                  :key="entry.day"
                  class="macro-item mb-4"
                >
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption font-weight-bold">{{ entry.day }}</span>
                    <span class="text-cyan text-caption">{{ entry.items.length }} rutina(s)</span>
                  </div>
                  <div
                    v-for="item in entry.items"
                    :key="item.id"
                    class="text-caption text-medium-emphasis"
                  >
                    {{ item.nombre_rutina }} · {{ item.ejercicios.length }} ejercicios
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </template>
      </div>
    </main>
  </div>
</template>

<style src="../../assets/clientDashboard.css" scoped></style>
