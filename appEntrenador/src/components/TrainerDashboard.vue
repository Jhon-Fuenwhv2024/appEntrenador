<template>
  <div class="dashboard-bg">
    
    <nav class="sidebar-pill">
      <v-avatar color="rgba(0, 229, 255, 0.05)" size="48" class="mb-8 logo-avatar">
        <v-icon icon="mdi-dumbbell" color="#00E5FF" size="24"></v-icon>
      </v-avatar>
      
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

    <main class="main-content flex-grow-1 pa-8">
      
      <div class="d-flex justify-space-between align-start mb-8 mt-2">
        <div>
          <div class="text-caption text-grey-lighten-1 mb-1 d-flex align-center">
            <v-icon icon="mdi-calendar-blank-outline" size="16" class="mr-2"></v-icon>
            {{ fechaActual }}
          </div>
          <h1 class="text-h4 font-weight-bold mb-1 text-white">Dashboard</h1>
          <p class="text-grey-lighten-1 text-subtitle-2 font-weight-regular">
            Bienvenido de vuelta, <span style="color: #00E5FF;">{{ userName }}</span>
          </p>
        </div>

        <div class="d-flex align-center">
          <v-badge content="3" color="#00E5FF" text-color="black" offset-x="5" offset-y="5">
            <v-btn icon="mdi-bell-outline" variant="outlined" color="grey-darken-2" class="mr-4 rounded-circle bg-card" size="small"></v-btn>
          </v-badge>
          
          <div class="profile-pill d-flex align-center bg-card px-2 py-1 rounded-pill border-subtle">
            <v-avatar color="#00E5FF" size="32" class="mr-3">
              <span class="text-black font-weight-bold text-caption">{{ obtenerInicial(userName) }}</span>
            </v-avatar>
            <div class="mr-3">
              <div class="text-white text-caption font-weight-bold lh-1">{{ userName }}</div>
              <div class="text-grey text-caption lh-1 mt-1" style="font-size: 10px !important;">Entrenador</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="userRole === 'trainer'">
        
        <v-row class="mb-6" align="stretch">
          
          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-5 bg-card border-subtle h-100 rounded-xl stat-card">
              <div class="d-flex flex-column h-100">
                <v-avatar color="rgba(0, 229, 255, 0.1)" size="40" class="mb-4 rounded-lg">
                  <v-icon icon="mdi-account-group-outline" color="#00E5FF" size="20"></v-icon>
                </v-avatar>
                <div class="text-h4 font-weight-bold text-white mb-1">{{ alumnos.length }}</div>
                <div class="text-caption text-grey">Total Alumnos</div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-5 bg-card border-subtle h-100 rounded-xl stat-card">
              <div class="d-flex flex-column h-100">
                <v-avatar color="rgba(76, 175, 80, 0.1)" size="40" class="mb-4 rounded-lg">
                  <v-icon icon="mdi-clipboard-text-outline" color="#4CAF50" size="20"></v-icon>
                </v-avatar>
                <div class="text-h4 font-weight-bold text-white mb-1">24</div>
                <div class="text-caption text-grey">Rutinas Activas</div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-5 bg-card border-subtle h-100 rounded-xl stat-card">
              <div class="d-flex flex-column h-100">
                <v-avatar color="rgba(255, 152, 0, 0.1)" size="40" class="mb-4 rounded-lg">
                  <v-icon icon="mdi-food-apple-outline" color="#FF9800" size="20"></v-icon>
                </v-avatar>
                <div class="text-h4 font-weight-bold text-white mb-1">18</div>
                <div class="text-caption text-grey">Dietas Activas</div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-5 bg-card border-subtle h-100 rounded-xl stat-card">
              <div class="d-flex flex-column h-100">
                <div class="d-flex justify-space-between align-start mb-4">
                  <v-avatar color="rgba(156, 39, 176, 0.1)" size="40" class="rounded-lg">
                    <v-icon icon="mdi-trending-up" color="#9C27B0" size="20"></v-icon>
                  </v-avatar>
                  <v-chip color="rgba(76, 175, 80, 0.2)" text-color="#4CAF50" size="small" class="font-weight-bold rounded-lg border-0">+12%</v-chip>
                </div>
                <div class="text-h4 font-weight-bold text-white mb-1">12%</div>
                <div class="text-caption text-grey">Crecimiento</div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row align="stretch">
          
          <v-col cols="12" md="8">
            <v-card class="pa-6 bg-card border-subtle h-100 rounded-xl d-flex flex-column overflow-hidden" elevation="0">
              <div class="d-flex justify-space-between align-start mb-6">
                <div>
                  <h3 class="text-subtitle-1 font-weight-bold text-white mb-0">Actividad Mensual</h3>
                  <p class="text-caption text-grey mb-0">Crecimiento de alumnos y planes activos</p>
                </div>
                <div class="d-flex gap-3 text-caption">
                  <div class="d-flex align-center"><span class="dot bg-cyan mr-2"></span> Alumnos</div>
                  <div class="d-flex align-center"><span class="dot bg-green mr-2"></span> Rutinas</div>
                  <div class="d-flex align-center"><span class="dot bg-orange mr-2"></span> Dietas</div>
                </div>
              </div>
              
              <div class="chart-container flex-grow-1 position-relative mt-4">
                 <svg viewBox="0 0 700 260" class="chart-svg">
                    <path d="M0,140 Q50,130 100,120 T200,100 T300,110 T400,60 T500,40" fill="none" stroke="#FF9800" stroke-width="2" />
                    <path d="M0,130 Q50,110 100,100 T200,90 T300,100 T400,40 T500,20" fill="none" stroke="#4CAF50" stroke-width="2" />
                    <path d="M0,110 Q50,90 100,80 T200,85 T300,60 T400,30 T500,10" fill="none" stroke="#00E5FF" stroke-width="3" />
                    <path d="M0,110 Q50,90 100,80 T200,85 T300,60 T400,30 T500,10 L500,150 L0,150 Z" fill="url(#cyan-gradient)" opacity="0.3" />
                    
                    <defs>
                      <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#00E5FF" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                 </svg>
                 <div class="y-axis">
                   <span>28</span>
                   <span>21</span>
                   <span>14</span>
                   <span>7</span>
                 </div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
  <div class="mb-4">
    <h3 class="text-subtitle-1 font-weight-bold text-white mb-0">
      Acciones Rápidas
    </h3>
    <p class="text-caption text-grey mb-0">
      Gestiona tus herramientas
    </p>
  </div>

<v-card
class="pa-5 bg-card border-subtle rounded-xl mb-4"
elevation="0"

>


<div class="d-flex align-start mb-4">



  <v-avatar
    color="rgba(0,229,255,.1)"
    size="42"
    class="mr-3"
  >
    <v-icon
      icon="mdi-link-variant"
      color="#00E5FF"
    />
  </v-avatar>

  <div>
    <div class="text-white font-weight-bold">
      Nueva Invitación
    </div>

    <div class="text-grey text-caption">
      Genera un link para tus clientes
    </div>
  </div>
</div>

<v-btn
  block
  color="#00E5FF"
  class="text-black font-weight-bold rounded-lg"
  @click="generarEnlace"
  :loading="cargandoLink"
>
  <v-icon icon="mdi-link-variant" class="mr-2"></v-icon> Generar Link
</v-btn>


  </v-card>

<v-card
class="pa-4 bg-card border-subtle rounded-xl mb-4"
elevation="0"

>


<div class="d-flex align-center justify-space-between w-100">
  <div class="d-flex align-center">
    <v-avatar
      color="rgba(76,175,80,.1)"
      size="42"
      class="mr-3"
    >
      <v-icon
        icon="mdi-dumbbell"
        color="#4CAF50"
      />
    </v-avatar>

    <div>
      <div class="text-white font-weight-bold">
        Asignar Rutinas
      </div>

      <div class="text-grey text-caption">
        Gestiona planes de entrenamiento personalizados
      </div>
    </div>
  </div>
  <v-icon icon="mdi-chevron-right" color="grey"></v-icon>
</div>


  </v-card>

<v-card
class="pa-4 bg-card border-subtle rounded-xl"
elevation="0"

>


<div class="d-flex align-center justify-space-between w-100">
  <div class="d-flex align-center">
    <v-avatar
      color="rgba(255,152,0,.1)"
      size="42"
      class="mr-3"
    >
      <v-icon
        icon="mdi-food-apple"
        color="#FF9800"
      />
    </v-avatar>

    <div>
      <div class="text-white font-weight-bold">
        Planes de Dieta
      </div>

      <div class="text-grey text-caption">
        Configura planes nutricionales a medida
      </div>
    </div>
  </div>
  <v-icon icon="mdi-chevron-right" color="grey"></v-icon>
</div>


  </v-card>
</v-col>

        </v-row>
        <v-row class="mt-6">
  <v-col cols="12">
    <v-card
      class="pa-6 bg-card border-subtle rounded-xl"
      elevation="0"
    >
      <div class="d-flex justify-space-between">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold text-white">
            Actividad Reciente
          </h3>


      <p class="text-caption text-grey mb-0">
        Últimas acciones en tu dashboard
      </p>
    </div>

    <span class="text-grey text-caption">
      Hoy
    </span>
  </div>
</v-card>


  </v-col>
</v-row>

      </div>
    </main>

    <aside v-if="userRole === 'trainer'" class="right-panel pa-6 d-flex flex-column bg-card border-left-subtle">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 8px; margin-bottom: 4px;">
        <h3 class="text-subtitle-1 font-weight-bold text-white" style="margin: 20px 20px 2px 20px;">Mis Alumnos</h3>
        <v-icon icon="mdi-dots-horizontal" color="grey" size="small" style="cursor: pointer; margin-right: 12px;"></v-icon>
      </div>
        <p class="text-caption-alumnos">{{ alumnosFiltrados.length }} alumnos</p>
       

      <v-text-field
        v-model="busqueda"
        density="compact"
        variant="solo"
        bg-color="transparent"
        placeholder="Buscar alumno..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        class="mb-4 search-input"
        rounded="pill"
      ></v-text-field>

      <v-progress-linear v-if="loadingAlumnos" indeterminate color="#00E5FF" class="mb-4"></v-progress-linear>

      <div v-else-if="alumnosFiltrados.length === 0" class="text-center mt-10">
        <p class="text-grey text-caption">No hay alumnos registrados.</p>
      </div>

      <div v-else class="flex-grow-1 list-scroll d-flex flex-column w-100">
        <div v-for="alumno in alumnosFiltrados" :key="alumno.id" class="student-item d-flex align-center pa-2 rounded-lg">
          <v-avatar color="#0F2C31" size="42" class="mr-4 flex-shrink-0">
            <span class="text-white font-weight-bold" style="font-size: 14px;">{{ obtenerInicial(alumno.nombre) }}</span>
          </v-avatar>
          
          <div class="flex-grow-1" style="min-width: 0;">
            <div class="text-white font-weight-bold text-body-2 mb-1 text-truncate">{{ alumno.nombre }}</div>
            <div class="d-flex align-center">
              <span class="text-grey text-caption mr-2 text-truncate">@{{ alumno.username }}</span>
              <span class="status-chip" :class="'chip-' + (alumno.status ? alumno.status.toLowerCase() : 'activo')">
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
  let fecha = new Date().toLocaleDateString('es-ES', opciones);
  return fecha.charAt(0).toUpperCase() + fecha.slice(1); // Capitaliza la primera letra
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

const obtenerInicial = (nombre) => nombre ? nombre.substring(0, 2).toUpperCase() : '??';

const getStatusColor = (status) => {
  const estado = status ? status.toLowerCase() : 'activo';
  if (estado === 'activo') return '#4CAF50'; 
  if (estado === 'pendiente') return '#FF9800';
  if (estado === 'inactivo') return '#F44336';
  return '#4CAF50';
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