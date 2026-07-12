<script setup>
import { onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import TrainerDashboardView from '../features/trainer/TrainerDashboardView.vue';
import ClientDashboardView from '../features/client/ClientDashboardView.vue';
import { getSessionUser, isAuthenticated } from '../shared/auth/session.js';

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
