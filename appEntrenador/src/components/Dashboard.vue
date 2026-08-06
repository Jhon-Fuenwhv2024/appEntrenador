<script setup>
import { defineAsyncComponent, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getSessionUser, isAuthenticated } from '../shared/auth/session.js';

// Optimización: solo descarga el dashboard del rol activo (Feature 089).
const TrainerDashboardView = defineAsyncComponent(() => (
  import('../features/trainer/TrainerDashboardView.vue')
));
const ClientDashboardView = defineAsyncComponent(() => (
  import('../features/client/ClientDashboardView.vue')
));

const router = useRouter();
const userRole = shallowRef('');

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/');
    return;
  }

  const user = getSessionUser();
  userRole.value = user?.rol || '';
});
</script>

<template>
  <TrainerDashboardView v-if="userRole === 'trainer'" />
  <ClientDashboardView v-else-if="userRole === 'client'" />
</template>
