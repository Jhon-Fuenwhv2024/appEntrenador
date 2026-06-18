<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 pa-5" color="surface">
          <v-card-title class="text-center">
            <h2 class="primary--text">Iniciar Sesión</h2>
          </v-card-title>
          
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Nombre de Usuario"
                prepend-icon="mdi-account"
                color="primary"
                outlined
                required
              />
              
              <v-text-field
                v-model="password"
                label="Contraseña"
                prepend-icon="mdi-lock"
                type="password"
                color="primary"
                outlined
                required
              />
              
              <v-btn
                type="submit"
                block
                color="primary"
                class="mt-4"
                large
              >
                Entrar
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const username = ref('');
const password = ref('');

const handleLogin = () => {
  console.log('Usuario:', username.value, 'Contraseña:', password.value);
};
</script>

<style scoped>
/* Vuetify maneja gran parte del diseño, esto es solo extra */
.v-card {
  border-radius: 16px !important;
}
</style>