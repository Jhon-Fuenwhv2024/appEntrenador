<template>
  <div class="login-wrapper">
    <v-card class="elevation-24 pa-8 login-card" width="100%" max-width="420" color="surface">
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
            type="password" 
            color="primary"
            required
            density="compact"
          >
          </v-text-field>
          
          <v-btn type="submit" block color="primary" class="mt-6 text-black font-weight-bold" size="large">
            Entrar
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
import { ref } from 'vue';

const username = ref('');
const password = ref('');

const handleLogin = () => {
  console.log('Usuario:', username.value, 'Contraseña:', password.value);

  router.push('/dashboard');

};
</script>

<style src="../assets/login.css" scoped></style>