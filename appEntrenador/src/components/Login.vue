<template>
  <div class="login-wrapper">
    <v-card class="elevation-24 pa-8 login-card" width="100%" max-width="420" color="surface">
      <div class="app-brand">
        <div class="app-brand-icon">
          <AppLogo size="lg" />
        </div>
        <span class="app-brand-name">{{ APP_NAME }}</span>
      </div>
      <h2 class="text-primary font-weight-bold login-title">Iniciar Sesión</h2>
      
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field 
            v-model="username" 
            label="Nombre de Usuario" 
            prepend-icon="mdi-account" 
            color="primary"
            required
            density="compact" 
            class="mb-2"
          >
          </v-text-field>
          
          <v-text-field 
            v-model="password" 
            label="Contraseña" 
            prepend-icon="mdi-lock" 
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showPassword ? 'text' : 'password'" 
            color="primary"
            required
            density="compact"
            @click:append-inner="showPassword = !showPassword"
          >
          </v-text-field>

          <v-alert 
            v-if="errorMessage" 
            type="error" 
            variant="tonal" 
            class="mt-4 text-body-2"
          >
            {{ errorMessage }}
          </v-alert>
          
          <v-btn type="submit" block color="primary" class="mt-6 text-black font-weight-bold" size="large">
            Entrar
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { APP_NAME } from '../config/app.js';
import AppLogo from './AppLogo.vue';

const username = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref(''); 
const showPassword = ref(false); // <-- NUEVA variable para controlar si se ve la clave

const handleLogin = async () => {
  try {
    errorMessage.value = ''; 

    const response = await axios.post('http://localhost:3000/api/login', {
      username: username.value,
      password: password.value
    });

    if (response.data.success) {
      console.log('¡Conexión exitosa!', response.data);
      
      localStorage.setItem('userRole', response.data.user.rol);
      localStorage.setItem('userName', response.data.user.nombre);
      localStorage.setItem('userId', response.data.user.id);

      router.push('/dashboard');
    }
  } catch (error) {
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = 'No se pudo conectar con el servidor backend. ¿Está encendido?';
    }
    console.error('Error en el inicio de sesión:', error);
  }
};
</script>

<style src="../assets/login.css" scoped></style>