<template>
  <v-container fluid class="bg-grey-lighten-4 fill-height align-start">
    <v-row>
      <v-col cols="12">
        <v-card class="pa-4 d-flex justify-space-between align-center elevation-2" color="primary">
          <div>
            <h2 class="text-white font-weight-bold">
              <v-icon icon="mdi-hand-wave" class="mr-2"></v-icon>
              Hola, {{ userName }}
            </h2>
            <v-chip size="small" :color="userRole === 'trainer' ? 'black' : 'white'" class="mt-2 font-weight-bold">
              {{ userRole === 'trainer' ? 'Modo Entrenador' : 'Modo Alumno' }}
            </v-chip>
          </div>
          
          <v-btn color="error" variant="elevated" prepend-icon="mdi-logout" @click="handleLogout">
            Cerrar Sesión
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="userRole === 'trainer'">
        <v-card class="pa-6 elevation-2 rounded-lg">
          <h3 class="text-h5 font-weight-bold text-primary mb-4">
            <v-icon icon="mdi-clipboard-account" class="mr-2"></v-icon>
            Panel de Control del Entrenador
          </h3>
          <p class="text-body-1 mb-4">Desde aquí podrás gestionar a tus alumnos, crear rutinas y generar invitaciones.</p>
          
          <v-row>
            <v-col cols="12" sm="4">
              <v-btn color="primary" block size="large" prepend-icon="mdi-link-variant" @click="generarEnlace" :loading="cargandoLink">
                Generar Invitación
              </v-btn>
            </v-col>
            <v-col cols="12" sm="4">
              <v-btn color="secondary" block size="large" prepend-icon="mdi-account-group">
                Ver Mis Alumnos
              </v-btn>
            </v-col>
          </v-row>

          <v-alert v-if="invitationLink" type="success" variant="tonal" class="mt-6">
            <div class="text-subtitle-2 mb-2 font-weight-bold text-black">¡Enlace generado con éxito! Cópialo y envíaselo a tu alumno:</div>
            <v-text-field 
              readonly 
              :model-value="invitationLink" 
              density="compact" 
              variant="outlined"
              bg-color="white"
              append-inner-icon="mdi-content-copy" 
              @click:append-inner="copiarLink" 
              hide-details
            ></v-text-field>
          </v-alert>

        </v-card>
      </v-col>

      <v-col cols="12" v-if="userRole === 'client'">
        <v-card class="pa-6 elevation-2 rounded-lg">
          <h3 class="text-h5 font-weight-bold text-primary mb-4">
            <v-icon icon="mdi-dumbbell" class="mr-2"></v-icon>
            Mi Área de Entrenamiento
          </h3>
          <p class="text-body-1 mb-4">Aquí verás las rutinas y dietas que tu entrenador ha preparado para ti.</p>
          
          <v-row>
            <v-col cols="12" sm="4">
              <v-btn color="primary" block size="large" prepend-icon="mdi-calendar-check">
                Ver Rutina de Hoy
              </v-btn>
            </v-col>
            <v-col cols="12" sm="4">
              <v-btn color="secondary" block size="large" prepend-icon="mdi-food-apple">
                Ver Mi Dieta
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios'; // <-- Importante: Añadimos axios para hacer la petición

const router = useRouter();

const userName = ref('');
const userRole = ref('');

// Nuevas variables para manejar la creación del enlace
const invitationLink = ref('');
const cargandoLink = ref(false);

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');

  if (!storedRole) {
    router.push('/'); 
    return;
  }

  userRole.value = storedRole;
  userName.value = storedName;
});

const handleLogout = () => {
  localStorage.clear(); 
  router.push('/');     
};

// --- NUEVAS FUNCIONES PARA EL ENTRENADOR ---

const generarEnlace = async () => {
  try {
    cargandoLink.value = true;
    // Llamamos a la ruta que creamos en Node.js
    const response = await axios.post('http://localhost:3000/api/generate-token');
    
    if (response.data.success) {
      // Guardamos el link en la variable para que aparezca en pantalla
      invitationLink.value = response.data.link_invitacion;
    }
  } catch (error) {
    console.error('Error al generar la invitación:', error);
    alert('Hubo un error al generar el enlace.');
  } finally {
    cargandoLink.value = false;
  }
};

const copiarLink = () => {
  // Esta función copia el texto al portapapeles de tu computadora/celular
  navigator.clipboard.writeText(invitationLink.value);
  alert('¡Enlace copiado! Ya puedes pegarlo en WhatsApp.');
};
</script>

<style src="../assets/dashboard.css" scoped></style>