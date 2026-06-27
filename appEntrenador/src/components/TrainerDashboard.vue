<template>
  <div class="dashboard-bg">
    
    <nav class="sidebar-pill">
      <div class="logo-wrap">
        <v-icon icon="mdi-dumbbell" color="#00E5FF" size="22"></v-icon>
      </div>
      
      <div class="nav-item active">
        <v-icon icon="mdi-view-dashboard-outline" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-clipboard-text-outline" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-chart-line" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-cog-outline" size="24"></v-icon>
      </div>

      <div class="nav-item nav-bottom mb-0" @click="handleLogout" title="Cerrar Sesión">
        <v-icon icon="mdi-logout-variant" size="24"></v-icon>
      </div>
    </nav>

    <main class="main-content flex-grow-1">
      <header class="dashboard-header">
        <div class="header-left">
          <div class="header-date">
            <v-icon icon="mdi-calendar-blank-outline" size="14"></v-icon>
            {{ fechaActual }}
          </div>
          <h1 class="header-title">Dashboard</h1>
          <p class="header-greeting">
            Bienvenido de vuelta, <span class="text-cyan">{{ userName }}</span>
          </p>
        </div>

        <div class="header-right">
          <v-badge content="3" color="#00E5FF" text-color="#0B0D12" offset-x="4" offset-y="4">
            <button type="button" class="notification-btn" aria-label="Notificaciones">
              <v-icon icon="mdi-bell-outline" size="20" color="#8B929E"></v-icon>
            </button>
          </v-badge>

          <div class="profile-pill">
            <div class="profile-avatar">{{ obtenerIniciales(userName) }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">Entrenador</div>
            </div>
          </div>
        </div>
      </header>

      <div v-if="userRole === 'trainer'">
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-cyan">
              <v-icon icon="mdi-account-group-outline" size="20" color="#00E5FF"></v-icon>
            </div>
            <div class="stat-value">{{ alumnos.length }}</div>
            <div class="stat-label">Total Alumnos</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-green">
              <v-icon icon="mdi-clipboard-text-outline" size="20" color="#4CAF50"></v-icon>
            </div>
            <div class="stat-value">24</div>
            <div class="stat-label">Rutinas Activas</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-orange">
              <v-icon icon="mdi-food-apple-outline" size="20" color="#FF9800"></v-icon>
            </div>
            <div class="stat-value">18</div>
            <div class="stat-label">Dietas Activas</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon stat-icon-purple">
                <v-icon icon="mdi-trending-up" size="20" color="#A855F7"></v-icon>
              </div>
              <span class="growth-badge">+12%</span>
            </div>
            <div class="stat-value">12%</div>
            <div class="stat-label">Crecimiento</div>
          </div>
        </div>

        <div class="content-grid">
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <h3 class="section-title">Actividad Mensual</h3>
                <p class="section-subtitle">Crecimiento de alumnos y planes activos</p>
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="dot bg-cyan"></span>Alumnos</span>
                <span class="legend-item"><span class="dot bg-green"></span>Rutinas</span>
                <span class="legend-item"><span class="dot bg-orange"></span>Dietas</span>
              </div>
            </div>

            <div class="chart-container">
              <div class="y-axis">
                <span>28</span>
                <span>21</span>
                <span>14</span>
                <span>7</span>
              </div>
              <svg viewBox="0 0 620 220" preserveAspectRatio="none" class="chart-svg">
                <defs>
                  <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#00E5FF" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="55" x2="620" y2="55" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                <line x1="0" y1="110" x2="620" y2="110" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                <line x1="0" y1="165" x2="620" y2="165" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                <path d="M0,155 Q80,145 160,135 T320,120 T480,95 T620,75" fill="none" stroke="#FF9800" stroke-width="2" stroke-linecap="round"/>
                <path d="M0,145 Q80,130 160,118 T320,105 T480,78 T620,58" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>
                <path d="M0,130 Q80,115 160,100 T320,82 T480,52 T620,32" fill="none" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M0,130 Q80,115 160,100 T320,82 T480,52 T620,32 L620,220 L0,220 Z" fill="url(#cyan-gradient)"/>
              </svg>
            </div>
          </div>

          <div class="quick-actions">
            <div class="quick-actions-header">
              <h3 class="section-title">Acciones Rápidas</h3>
              <p class="section-subtitle">Gestiona tus herramientas</p>
            </div>

            <div class="invite-card">
              <div class="invite-card-top">
                <div class="invite-icon invite-icon-cyan">
                  <v-icon icon="mdi-link-variant" size="20" color="#00E5FF"></v-icon>
                </div>
                <div>
                  <div class="invite-title">Nueva Invitación</div>
                  <div class="invite-desc">Genera un link de acceso único para tus clientes</div>
                </div>
              </div>
              <button
                type="button"
                class="generate-link-btn"
                @click="generarEnlace"
                :disabled="cargandoLink"
              >
                <v-progress-circular v-if="cargandoLink" indeterminate size="18" width="2" color="#0B0D12" class="mr-2"></v-progress-circular>
                <v-icon v-else icon="mdi-link-variant" size="18" class="mr-2"></v-icon>
                Generar Link
              </button>
            </div>

            <div class="action-link-card">
              <div class="action-link-content">
                <div class="invite-icon invite-icon-green">
                  <v-icon icon="mdi-dumbbell" size="20" color="#4CAF50"></v-icon>
                </div>
                <div>
                  <div class="invite-title">Asignar Rutinas</div>
                  <div class="invite-desc">Gestiona planes de entrenamiento personalizados</div>
                </div>
              </div>
              <v-icon icon="mdi-chevron-right" size="20" color="#6B7280"></v-icon>
            </div>

            <div class="action-link-card">
              <div class="action-link-content">
                <div class="invite-icon invite-icon-orange">
                  <v-icon icon="mdi-food-apple" size="20" color="#FF9800"></v-icon>
                </div>
                <div>
                  <div class="invite-title">Planes de Dieta</div>
                  <div class="invite-desc">Configura planes nutricionales a medida</div>
                </div>
              </div>
              <v-icon icon="mdi-chevron-right" size="20" color="#6B7280"></v-icon>
            </div>
          </div>
        </div>

      </div>
    </main>

    <aside v-if="userRole === 'trainer'" class="right-panel">
      <div class="students-panel-top">
        <div class="students-panel-header">
          <div>
            <h3 class="students-panel-title">Mis Alumnos</h3>
            <p class="text-caption-alumnos">{{ alumnosFiltrados.length }} alumnos</p>
          </div>
          <v-icon icon="mdi-dots-horizontal" color="#6B7280" size="18" class="students-menu-icon"></v-icon>
        </div>

        <div class="search-bar">
          <v-icon icon="mdi-magnify" size="18" color="#6B7280" class="search-bar-icon"></v-icon>
          <input
            v-model="busqueda"
            type="text"
            class="search-bar-input"
            placeholder="Buscar alumno..."
          />
        </div>
      </div>

      <v-progress-linear v-if="loadingAlumnos" indeterminate color="#00E5FF" class="students-loader"></v-progress-linear>

      <div v-else-if="alumnosFiltrados.length === 0" class="students-empty">
        <p>No hay alumnos registrados.</p>
      </div>

      <div v-else class="students-list-scroll">
        <div
          v-for="alumno in alumnosFiltrados"
          :key="alumno.id"
          class="student-item"
        >
          <div class="student-avatar">
            {{ obtenerIniciales(alumno.nombre) }}
          </div>

          <div class="student-info">
            <div class="student-name">{{ alumno.nombre }}</div>
            <div class="student-meta">
              <span class="student-username">@{{ alumno.username }}</span>
              <span
                class="status-chip"
                :class="'chip-' + (alumno.status ? alumno.status.toLowerCase() : 'activo')"
              >
                {{ alumno.status || 'Activo' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const router = useRouter();

// Estados
const userName = ref('');
const userRole = ref('');
const invitationLink = ref('');
const cargandoLink = ref(false);
const busqueda = ref('');
const loadingAlumnos = ref(true);

// Fecha actual dinámica en formato "Domingo, 21 de Junio de 2026"
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

// Datos de alumnos (con estado simulado para coincidir con el diseño)
const alumnos = ref([]);

const snackbar = ref({ show: false, text: '', color: 'success' });

const alumnosFiltrados = computed(() => {
  if (!busqueda.value) return alumnos.value;
  return alumnos.value.filter(alumno => 
    alumno.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) || 
    alumno.username.toLowerCase().includes(busqueda.value.toLowerCase())
  );
});

const mostrarNotificacion = (texto, color = 'success') => {
  snackbar.value = { show: true, text: texto, color };
};

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

  userRole.value = storedRole;
  userName.value = storedName;

  if (storedRole === 'trainer') cargarAlumnos();
});

const cargarAlumnos = async () => {
  try {
    loadingAlumnos.value = true;
    const response = await axios.get(`${API_BASE_URL}/clients`);
    if (response.data.success) {
      // Agregamos estados aleatorios si no vienen de la BD para mostrar el diseño
      alumnos.value = response.data.clients.map((c, index) => ({
        ...c,
        status: index % 4 === 0 ? 'Inactivo' : (index % 3 === 0 ? 'Pendiente' : 'Activo')
      }));
    }
  } catch (error) {
    console.error(error);
    mostrarNotificacion('Error al cargar alumnos', 'error');
  } finally {
    loadingAlumnos.value = false;
  }
};

const generarEnlace = async () => {
  try {
    cargandoLink.value = true;
    const response = await axios.post(`${API_BASE_URL}/generate-token`);
    if (response.data.success) {
      invitationLink.value = response.data.link_invitacion;
      mostrarNotificacion('Link generado', 'success');
    }
  } catch (error) {
    mostrarNotificacion('Error al generar', 'error');
  } finally {
    cargandoLink.value = false;
  }
};

const copiarLink = () => {
  if (invitationLink.value) {
    navigator.clipboard.writeText(invitationLink.value);
    mostrarNotificacion('Copiado al portapapeles', 'info');
  }
};

const handleLogout = () => {
  localStorage.clear(); 
  router.push('/');     
};
</script>

<style src="../assets/trainerDashboard.css" scoped></style>