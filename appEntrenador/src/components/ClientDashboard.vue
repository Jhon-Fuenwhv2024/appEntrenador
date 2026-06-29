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

      <div class="nav-item nav-bottom mb-0" @click="handleLogout" title="Cerrar Sesión">
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
          <v-badge content="0" color="#00E5FF" text-color="#0B0D12" offset-x="4" offset-y="4">
            <button type="button" class="notification-btn" aria-label="Notificaciones">
              <v-icon icon="mdi-bell-outline" size="20" color="#8B929E"></v-icon>
            </button>
          </v-badge>

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
        <div v-if="!tienePlanActivo" class="client-empty-card">
          <v-icon icon="mdi-rocket-launch-outline" size="28" color="#8B929E" class="client-empty-icon"></v-icon>
          <h2 class="client-empty-title">¡Pronto verás tu progreso aquí!</h2>
          <p class="client-empty-desc">Tu entrenador está preparando tus planes de entrenamiento y dieta.</p>
        </div>

        <div v-else>
          <v-row class="mb-6">
            <v-col cols="12" sm="4">
              <div class="stat-mini-card">
                <v-icon icon="mdi-fire" color="#00E5FF" class="mr-3"></v-icon>
                <div>
                  <div class="stat-label">Racha</div>
                  <div class="stat-value">5 Días</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="stat-mini-card">
                <v-icon icon="mdi-weight-lifter" color="#4CAF50" class="mr-3"></v-icon>
                <div>
                  <div class="stat-label">Completados</div>
                  <div class="stat-value">12 Sesiones</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="stat-mini-card">
                <v-icon icon="mdi-scale-bathroom" color="#FF9800" class="mr-3"></v-icon>
                <div>
                  <div class="stat-label">Peso</div>
                  <div class="stat-value">75.5 kg</div>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="8">
              <div class="functional-card workout-card">
                <div class="d-flex justify-space-between align-center mb-6">
                  <div>
                    <h3 class="card-section-title">Entrenamiento de Hoy</h3>
                    <div class="card-section-subtitle">{{ sesionHoy.titulo }}</div>
                  </div>
                  <v-btn color="#00E5FF" class="text-black font-weight-bold rounded-lg" size="large">
                    Comenzar
                  </v-btn>
                </div>

                <div class="exercise-list">
                  <div v-for="(ejercicio, i) in sesionHoy.ejercicios" :key="i" class="exercise-item">
                    <div class="exercise-num">{{ i + 1 }}</div>
                    <div class="exercise-details">
                      <div class="exercise-name">{{ ejercicio.nombre }}</div>
                      <div class="exercise-meta">{{ ejercicio.series }} Series • {{ ejercicio.repeticiones }} Reps</div>
                    </div>
                    <v-chip size="x-small" variant="tonal" color="grey">{{ ejercicio.descanso }}s Descanso</v-chip>
                  </div>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="functional-card diet-card">
                <h3 class="card-section-title mb-4">Nutrición</h3>
                <div class="macro-item">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption">Proteína</span>
                    <span class="text-cyan text-caption">{{ dietaHoy.macros.proteina }}g / 160g</span>
                  </div>
                  <v-progress-linear model-value="80" color="#00E5FF" height="4" rounded></v-progress-linear>
                </div>
                <div class="macro-item mt-4">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption">Carbohidratos</span>
                    <span class="text-green text-caption">{{ dietaHoy.macros.carbs }}g / 280g</span>
                  </div>
                  <v-progress-linear model-value="60" color="#4CAF50" height="4" rounded></v-progress-linear>
                </div>
                <div class="macro-item mt-4">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption">Grasas</span>
                    <span class="text-orange text-caption">{{ dietaHoy.macros.grasas }}g / 70g</span>
                  </div>
                  <v-progress-linear model-value="45" color="#FF9800" height="4" rounded></v-progress-linear>
                </div>
                <v-btn variant="outlined" color="grey" block class="mt-8 rounded-lg text-white" size="small">
                  Ver Dieta Completa
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { APP_NAME } from '../config/app.js';
import AppLogo from './AppLogo.vue';

const router = useRouter();
const userName = ref('');

// --- LÓGICA DE ESTADOS (Misma lógica, nuevas variables) ---
const tienePlanActivo = ref(true); // Cambia a 'false' para ver el estado vacío original

const sesionHoy = ref({
  titulo: 'Empuje (Pecho, Hombro y Tríceps)',
  ejercicios: [
    { nombre: 'Press de Banca', series: 4, repeticiones: '10', descanso: 90 },
    { nombre: 'Press Militar', series: 3, repeticiones: '12', descanso: 60 },
    { nombre: 'Vuelos Laterales', series: 3, repeticiones: '15', descanso: 45 },
    { nombre: 'Extensión de Tríceps', series: 3, repeticiones: '12', descanso: 60 }
  ]
});

const dietaHoy = ref({
  macros: { proteina: 120, carbs: 180, grasas: 55 }
});

// --- TUS FUNCIONES ORIGINALES (Sin cambios) ---
const fechaActual = computed(() => {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fecha = new Date().toLocaleDateString('es-ES', opciones);
  return fecha
    .split(', ')
    .map((part, index) => {
      if (index === 0) return part.charAt(0).toUpperCase() + part.slice(1);
      return part.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    })
    .join(', ');
});

const obtenerIniciales = (nombre) => {
  if (!nombre) return '??';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
};

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');

  if (!storedRole) {
    router.push('/');
    return;
  }
  userName.value = storedName;
});

const handleLogout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style src="../assets/clientDashboard.css" scoped></style>
