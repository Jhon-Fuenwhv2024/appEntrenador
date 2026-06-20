<template>
  <div class="dashboard-wrapper">
    <v-row align="center" class="mb-6">
      <v-col cols="12" sm="6">
        <h1 class="text-h4 font-weight-bold">
          Bienvenido, <span class="text-primary">{{ userRole === 'trainer' ? 'Jhon' : 'Carlos' }}</span>
        </h1>
        <p class="text-grey-subtitle-1 text-grey">Hoy es {{ fechaFormateada }}</p>
      </v-col>
      
      <v-col cols="12" sm="6" class="text-sm-right">
        <v-btn-toggle v-model="userRole" mandatory color="primary" variant="outlined" density="compact">
          <v-btn value="trainer">Modo Entrenador</v-btn>
          <v-btn value="client">Modo Asesorado</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <div v-if="userRole === 'trainer'">
      <v-row class="mb-6">
        <v-col cols="12" sm="4" v-for="(stat, i) in trainerStats" :key="i">
          <v-card class="stat-card pa-4">
            <div class="d-flex justify-between align-center">
              <div>
                <p class="text-overline text-grey">{{ stat.title }}</p>
                <h3 class="text-h3 font-weight-bold text-primary">{{ stat.value }}</h3>
              </div>
              <v-icon :icon="stat.icon" size="40" color="primary" class="opacity-60"></v-icon>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <h2 class="text-h5 font-weight-bold mb-4">Mis Alumnos Activos</h2>
      <v-card class="pa-4 stat-card">
        <v-list bg-color="transparent">
          <v-list-item v-for="client in clients" :key="client.id" class="client-item pa-3">
            <template v-slot:prepend>
              <v-avatar color="grey-darken-3">
                <v-icon icon="mdi-account"></v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold text-white">{{ client.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-grey">Objetivo: {{ client.goal }} | Último entreno: {{ client.lastActive }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn color="primary" variant="text" icon="mdi-eye" @click="verRutinaAlumno(client)"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <v-dialog v-model="dialogOpen" max-width="600px">
        <v-card class="stat-card pa-4" style="background-color: #1E1E1E !important;">
          <v-card-title class="d-flex justify-between align-center">
            <span class="text-h5 font-weight-bold text-white">Rutina de {{ alumnoSeleccionado?.name }}</span>
            <v-btn icon="mdi-close" variant="text" color="grey" @click="dialogOpen = false"></v-btn>
          </v-card-title>
          
          <v-card-text>
            <p class="text-subtitle-2 text-primary mb-4">Día de hoy: {{ nombreDiaHoy }}</p>
            
            <v-table theme="dark" class="mb-6 custom-routine-table" v-if="alumnoSeleccionado?.planSemanal[nombreDiaHoy]?.ejercicios.length > 0">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold text-grey">Ejercicio</th>
                  <th class="text-left font-weight-bold text-grey">Reps</th>
                  <th class="text-left font-weight-bold text-grey">Peso</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ex, index) in alumnoSeleccionado?.planSemanal[nombreDiaHoy]?.ejercicios" :key="index">
                  <td class="text-white font-weight-bold">{{ ex.name }}</td>
                  <td class="text-grey-lighten-1">{{ ex.reps }}</td>
                  <td><v-chip size="small" color="primary">{{ ex.weight }}</v-chip></td>
                </tr>
              </tbody>
            </v-table>
            <p v-else class="text-grey italic-notes text-center my-4">No hay ejercicios asignados para hoy (Día de descanso).</p>

            <v-divider class="my-4" color="grey-darken-2"></v-divider>

            <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">Asignar Nuevo Ejercicio</h3>
            <v-form @submit.prevent="agregarEjercicio">
              <v-row density="compact">
                <v-col cols="12" sm="6">
                  <v-text-field v-model="nuevoEjercicio.name" label="Nombre Ejercicio" variant="outlined" color="primary" density="compact" required></v-text-field>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="nuevoEjercicio.reps" label="Reps (Ej: 4x10)" variant="outlined" color="primary" density="compact" required></v-text-field>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="nuevoEjercicio.weight" label="Peso (Ej: 20 Kg)" variant="outlined" color="primary" density="compact" required></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="nuevoEjercicio.notes" label="Indicaciones / Notas adicionales" variant="outlined" color="primary" density="compact"></v-text-field>
                </v-col>
              </v-row>
              <v-btn type="submit" block color="primary" class="text-black font-weight-bold mt-2">
                <v-icon icon="mdi-plus" class="mr-1"></v-icon> Agregar a la rutina
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>

    <div v-else>
      <v-row>
        <v-col cols="12" md="8">
          <h2 class="text-h5 font-weight-bold mb-4">
            Tu Rutina de Hoy: <span class="text-primary">{{ rutinaAlumnoAutenticado.nombreRutina }}</span>
          </h2>
          
          <v-card v-if="rutinaAlumnoAutenticado.ejercicios.length > 0" class="stat-card overflow-hidden">
            <v-table class="custom-routine-table" theme="dark">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold text-primary header-cell">Ejercicio</th>
                  <th class="text-left font-weight-bold text-primary header-cell">Repeticiones</th>
                  <th class="text-left font-weight-bold text-primary header-cell">Indicaciones</th>
                  <th class="text-left font-weight-bold text-primary header-cell">Carga (Sugerido)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(exercise, index) in rutinaAlumnoAutenticado.ejercicios" :key="index" class="table-row">
                  <td class="font-weight-bold text-white text-body-2">{{ exercise.name }}</td>
                  <td class="text-grey-lighten-1 text-body-2 font-mono">{{ exercise.reps }}</td>
                  <td class="text-grey-lighten-1 text-body-2 italic-notes">{{ exercise.notes }}</td>
                  <td>
                    <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
                      {{ exercise.weight }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <v-card v-else class="stat-card pa-6 text-center text-grey">
            <v-icon icon="mdi-bed" size="48" class="mb-2 text-primary opacity-60"></v-icon>
            <p class="text-body-1 font-weight-bold">¡Hoy toca descanso de campeones!</p>
            <p class="text-caption">Aprovecha para recuperarte al 100%.</p>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <h2 class="text-h5 font-weight-bold mb-4">Objetivo Nutricional</h2>
          <v-card class="pa-4 stat-card text-center">
            <v-progress-circular :model-value="75" :size="120" :width="12" color="primary">
              <span class="text-body-1 font-weight-bold">1,800 kcal</span>
            </v-progress-circular>
            <p class="text-caption text-grey mt-3">Has consumido el 75% de tus calorías diarias</p>
          </v-card>
        </v-col>
      </v-row>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// --- LÓGICA DE TIEMPO REAL ---
const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const numeroDiaHoy = new Date().getDay(); 
const nombreDiaHoy = diasSemana[numeroDiaHoy]; // Ej: 'Viernes'

const fechaFormateada = computed(() => {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
});

// --- VARIABLES DE CONTROL DE INTERFAZ ---
const userRole = ref('trainer'); // Iniciamos en entrenador para probar la función
const dialogOpen = ref(false);     // Controla si el modal está abierto o cerrado
const alumnoSeleccionado = ref(null); // Guarda los datos del alumno al que le diste clic

// Formulario reactivo para nuevos ejercicios
const nuevoEjercicio = ref({
  name: '',
  reps: '',
  notes: '',
  weight: ''
});

// --- BASE DE DATOS REESTRUCTURADA: Cada alumno tiene sus propias rutinas independientes ---
const clients = ref([
  { 
    id: 1, 
    name: 'Carlos Mendoza', 
    goal: 'Hipertrofia', 
    lastActive: 'Hoy',
    planSemanal: {
      Lunes: { nombreRutina: 'Lunes – Pierna', ejercicios: [{ name: 'Sentadilla Smith', reps: '4x12', notes: 'Profundo', weight: '60 Kg' }] },
      Martes: { nombreRutina: 'Martes – Espalda', ejercicios: [] },
      Miércoles: { nombreRutina: 'Miércoles – Descanso', ejercicios: [] },
      Jueves: { nombreRutina: 'Jueves – Hombro', ejercicios: [] },
      Viernes: { 
        nombreRutina: 'Viernes – Empuje Completo', 
        ejercicios: [
          { name: 'Press de Banca', reps: '4x10', notes: 'Bajada controlada', weight: '70 Kg' },
          { name: 'Press Militar', reps: '3x12', notes: 'Pesado', weight: '22 Kg' }
        ] 
      },
      Sábado: { nombreRutina: 'Sábado – Cardio', ejercicios: [] },
      Domingo: { nombreRutina: 'Domingo – Descanso', ejercicios: [] }
    }
  },
  { 
    id: 2, 
    name: 'Andrés Silva', 
    goal: 'Pérdida de Grasa', 
    lastActive: 'Ayer',
    planSemanal: {
      Viernes: { 
        nombreRutina: 'Viernes – Circuito Metabólico', 
        ejercicios: [{ name: 'Sentadilla con salto', reps: '4x20', notes: 'Sin descanso', weight: 'Corporal' }] 
      }
    }
  },
  { 
    id: 3, 
    name: 'Laura Restrepo', 
    goal: 'Fuerza', 
    lastActive: 'Hace 3 días',
    planSemanal: {
      Viernes: { 
        nombreRutina: 'Viernes – Powerlifting', 
        ejercicios: [{ name: 'Peso Muerto convencional', reps: '5x5', notes: 'Foco técnico máximo', weight: '100 Kg' }] 
      }
    }
  }
]);

// --- FUNCIONES INTERACTIVAS ---

// Abre el modal y guarda el alumno seleccionado en memoria
const verRutinaAlumno = (client) => {
  alumnoSeleccionado.value = client;
  dialogOpen.value = true;
};

// Agrega el nuevo ejercicio al plan específico del alumno seleccionado
const agregarEjercicio = () => {
  if (!alumnoSeleccionado.value) return;

  // Accedemos al día de hoy dentro del plan del alumno y empujamos el objeto
  alumnoSeleccionado.value.planSemanal[nombreDiaHoy].ejercicios.push({
    name: nuevoEjercicio.value.name,
    reps: nuevoEjercicio.value.reps,
    notes: nuevoEjercicio.value.notes || 'Sin observaciones',
    weight: nuevoEjercicio.value.weight
  });

  // Limpiamos los campos del formulario
  nuevoEjercicio.value = { name: '', reps: '', notes: '', weight: '' };
};

// --- COMPUTADA PARA LA VISTA DEL ALUMNO AUTENTICADO ---
// Supongamos que el alumno que inició sesión es Carlos (ID: 1)
const rutinaAlumnoAutenticado = computed(() => {
  const carlos = clients.value.find(c => c.id === 1);
  return carlos.planSemanal[nombreDiaHoy] || { nombreRutina: 'Descanso', ejercicios: [] };
});

const trainerStats = ref([
  { title: 'Total Alumnos', value: '18', icon: 'mdi-account-group' },
  { title: 'Rutinas Activas', value: '14', icon: 'mdi-dumbbell' },
  { title: 'Alertas de Inactividad', value: '2', icon: 'mdi-alert-circle' },
]);
</script>

<style src="../assets/dashboard.css" scoped></style>